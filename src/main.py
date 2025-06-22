from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, BackgroundTasks, Form, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import uuid
import json
from typing import List, Optional
from pydantic import BaseModel
import logging

from services import AudioProcessor, ElevenLabsService, TranscriptGenerator, VideoAudioReplacer
from services.video import generate_video_thumbnail
from models import api as models
from models.database import User, Project, Video, AudioFile, AudioType, TranscriptionLine, EditRequest
from models.api import UploadResponse, TTSRequest, ReplaceSegmentRequest, VideoAudioReplaceRequest, ApplyChangesRequest
from core.database import get_db, engine
from core import auth
from core.middleware import RequestResponseLoggingMiddleware, PerformanceLoggingMiddleware
from services.changelog import apply_transcript_changes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Audio Editor API", version="1.0.0")

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.get("/health")
def detailed_health_check():
    return {
        "status": "ok",
        "service": "Audio Editor API",
        "version": "1.0.0",
        "database": "connected"
    }

# Add logging middleware (order matters - add before CORS)
app.add_middleware(RequestResponseLoggingMiddleware)
app.add_middleware(PerformanceLoggingMiddleware, slow_request_threshold=2.0)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
audio_processor = AudioProcessor()
elevenlabs_service = ElevenLabsService()

# Create necessary directories
os.makedirs("temp", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)
os.makedirs("thumbnails", exist_ok=True)

# ==============================================================================
# 1. Authentication
# ==============================================================================
@app.post("/auth/register", response_model=models.ApiResponse[models.AuthResponse])
def register_user(user_in: models.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists by email
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username is provided and already exists
    if user_in.username:
        db_user_username = db.query(User).filter(User.username == user_in.username).first()
        if db_user_username:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Generate username if not provided
    username = user_in.username
    if not username:
        # Generate username from email prefix
        email_prefix = user_in.email.split('@')[0]
        # Ensure uniqueness by adding number if needed
        base_username = email_prefix
        username = base_username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
    
    hashed_password = auth.get_password_hash(user_in.password)
    db_user = User(
        username=username,
        email=user_in.email, 
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token = auth.create_access_token(data={"sub": db_user.email})
    
    user_out = models.UserOut.from_orm(db_user)
    
    return models.ApiResponse(
        data=models.AuthResponse(
            access_token=access_token,
            refresh_token=None, # Not implemented yet
            token_type="bearer",
            user=user_out
        ),
        message="User registered successfully"
    )

@app.post("/auth/login", response_model=models.ApiResponse[models.AuthResponse])
def login(login_request: models.LoginRequest, db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, login_request.email, login_request.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    user_out = models.UserOut.from_orm(user)
    
    return models.ApiResponse(
        data=models.AuthResponse(
            access_token=access_token,
            refresh_token=None,  # Not implemented yet
            token_type="bearer",
            user=user_out
        ),
        message="Login successful"
    )

@app.post("/auth/token", response_model=models.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=models.ApiResponse[models.UserOut])
def read_users_me(current_user: User = Depends(auth.get_current_user)):
    return models.ApiResponse(data=current_user)

# ==============================================================================
# 2. Project Workflow
# ==============================================================================

def process_video_and_generate_transcript(project_id: str, video_path: str, db: Session):
    """
    Background task to extract audio, generate transcript, and create thumbnail.
    """
    try:
        logger.info(f"Starting video processing for project {project_id}")
        
        # 1. Generate thumbnail from video first frame
        thumbnail_filename = f"{project_id}_thumbnail.jpg"
        thumbnail_path = os.path.join("thumbnails", thumbnail_filename)
        logger.info(f"Generating thumbnail to {thumbnail_path}")
        thumbnail_result = generate_video_thumbnail(video_path, thumbnail_path)
        
        # Update project with thumbnail path
        project = db.query(Project).get(project_id)
        if project and thumbnail_result:
            project.thumbnail_path = thumbnail_path
            db.commit()
            logger.info(f"Thumbnail saved for project {project_id}")
        
        # 2. Extract audio
        file_id = uuid.uuid4()
        audio_filename = f"{file_id}.mp3"
        audio_path = os.path.join("temp", audio_filename)
        logger.info(f"Extracting audio to {audio_path}")
        audio_processor.extract_audio_from_video(video_path, audio_path)

        # 3. Create AudioFile record for extracted audio
        audio_file = AudioFile(
            project_id=project_id,
            file_path=audio_path,
            type=AudioType.extracted
        )
        db.add(audio_file)
        db.commit()

        # 4. Generate transcript with segment timestamps
        transcript_generator = TranscriptGenerator()
        logger.info("Generating transcript with segment timestamps...")
        transcript = transcript_generator.generate_transcript(audio_path, get_word_timestamps=False)

        # 5. Save transcript lines to DB
        if transcript and hasattr(transcript, 'segments') and transcript.segments:
            logger.info(f"Saving {len(transcript.segments)} transcript segments to database")
            for i, segment in enumerate(transcript.segments):
                try:
                    # Access segment data - handle both object attributes and dictionary keys
                    if hasattr(segment, 'text'):
                        # Object format
                        segment_text = segment.text
                        segment_start = segment.start
                        segment_end = segment.end
                        segment_words = getattr(segment, 'words', None)
                    else:
                        # Dictionary format
                        segment_text = segment.get('text', '')
                        segment_start = segment.get('start')
                        segment_end = segment.get('end')
                        segment_words = segment.get('words')
                    
                    logger.info(f"Segment {i}: start={segment_start}, end={segment_end}, text='{segment_text[:50]}...'")
                    
                    db_transcript = TranscriptionLine(
                        project_id=project_id,
                        line_index=i,
                        text=segment_text,
                        start_time=segment_start,
                        end_time=segment_end,
                        words=segment_words 
                    )
                    db.add(db_transcript)
                except Exception as e:
                    logger.error(f"Error processing segment {i}: {e}")
                    logger.error(f"Segment type: {type(segment)}, content: {segment}")
                    continue
        else:
            logger.error("No transcript segments found or transcript generation failed")
            # Update project status to error
            project = db.query(Project).get(project_id)
            if project:
                project.status = 'error'
                db.commit()
            return
        
        # 6. Update project status
        project = db.query(Project).get(project_id)
        if project:
            project.status = 'completed'
        
        db.commit()
        logger.info(f"Project {project_id}: Processing completed successfully")
        
    except Exception as e:
        logger.error(f"Error processing project {project_id}: {e}")
        # Update project status to error
        project = db.query(Project).get(project_id)
        if project:
            project.status = 'error'
            db.commit()

def map_project_to_response(project: Project, request_base_url: str = "") -> models.ProjectOut:
    """
    Map database Project to API ProjectOut response with proper field mapping
    """
    # Generate video URL if video exists
    video_url = None
    if project.video and project.video.file_path:
        video_url = f"/projects/{project.id}/video"
    
    # Generate thumbnail URL if thumbnail exists
    thumbnail_url = None
    if project.thumbnail_path and os.path.exists(project.thumbnail_path):
        thumbnail_url = f"/projects/{project.id}/thumbnail"
    
    return models.ProjectOut(
        id=project.id,
        title=project.name,  # Map 'name' to 'title'
        description=project.description,
        video_url=video_url,
        thumbnail_url=thumbnail_url,
        duration=project.duration,
        file_size=project.file_size,
        mime_type=project.mime_type,
        status=project.status,
        created_at=project.created_at,
        updated_at=project.updated_at,
        user_id=project.owner_id
    )

@app.post("/projects", response_model=models.ApiResponse[models.ProjectOut], status_code=201)
def create_project(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    video_file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Step 1: User creates a project with a video file.
    """
    try:
        # Save video file
        file_id = uuid.uuid4()
        video_path = f"uploads/{file_id}_{video_file.filename}"
        with open(video_path, "wb") as buffer:
            content = video_file.file.read()
            buffer.write(content)

        # Get file metadata
        file_size = len(content)
        mime_type = video_file.content_type

        # Create project in DB
        project = Project(
            name=title,
            description=description,
            owner_id=current_user.id,
            video_filename=video_file.filename,
            status='processing',
            file_size=file_size,
            mime_type=mime_type
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        # Create Video record
        video = Video(
            project_id=project.id,
            file_path=video_path
        )
        db.add(video)
        db.commit()

        # Step 2: Start background task for audio extraction and transcription
        background_tasks.add_task(process_video_and_generate_transcript, project.id, video_path, db)

        # Map to response format
        base_url = str(request.base_url).rstrip('/') if request else ""
        project_response = map_project_to_response(project, base_url)
        
        return models.ApiResponse(
            data=project_response,
            message="Project created successfully"
        )
        
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@app.get("/projects", response_model=models.ApiResponse[models.PaginatedResponse[models.ProjectOut]])
def get_user_projects(
    page: int = 1,
    pageSize: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sortBy: str = "created_at", 
    sortOrder: str = "desc",
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Get paginated list of projects for the current user with filtering and sorting.
    """
    try:
        # Build query
        query = db.query(Project).filter(Project.owner_id == current_user.id)
        
        # Apply filters
        if status:
            query = query.filter(Project.status == status)
        
        if search:
            query = query.filter(Project.name.ilike(f"%{search}%"))
        
        # Apply sorting
        sort_column = getattr(Project, sortBy, Project.created_at)
        if sortOrder == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * pageSize
        projects = query.offset(offset).limit(pageSize).all()
        
        # Calculate total pages
        total_pages = (total + pageSize - 1) // pageSize
        
        # Map to response format
        base_url = str(request.base_url).rstrip('/') if request else ""
        project_responses = [map_project_to_response(project, base_url) for project in projects]
        
        paginated_response = models.PaginatedResponse(
            items=project_responses,
            total=total,
            page=page,
            pageSize=pageSize,
            totalPages=total_pages
        )
        
        return models.ApiResponse(
            data=paginated_response,
            message="Projects retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error fetching projects: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {str(e)}")

@app.get("/projects/{project_id}", response_model=models.ApiResponse[models.ProjectOut])
def get_project(
    project_id: str,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Get single project by ID.
    """
    try:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == current_user.id
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        base_url = str(request.base_url).rstrip('/') if request else ""
        project_response = map_project_to_response(project, base_url)
        
        return models.ApiResponse(
            data=project_response,
            message="Project retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch project: {str(e)}")

@app.put("/projects/{project_id}", response_model=models.ApiResponse[models.ProjectOut])
def update_project(
    project_id: str,
    project_update: models.ProjectUpdate,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Update project details.
    """
    try:
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.owner_id == current_user.id
        ).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update fields if provided
        if project_update.title is not None:
            project.name = project_update.title  # Map 'title' to 'name'
        if project_update.description is not None:
            project.description = project_update.description
        if project_update.status is not None:
            project.status = project_update.status
        
        db.commit()
        db.refresh(project)
        
        base_url = str(request.base_url).rstrip('/') if request else ""
        project_response = map_project_to_response(project, base_url)
        
        return models.ApiResponse(
            data=project_response,
            message="Project updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")

@app.delete("/projects/{project_id}", response_model=models.ApiResponse[None])
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Deletes a project and its associated files.
    """
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        # Delete associated video file
        if project.video:
            video_path = project.video.file_path
            if os.path.exists(video_path):
                os.remove(video_path)
            db.delete(project.video)

        # Delete the project
        db.delete(project)
        db.commit()
        return models.ApiResponse(message="Project deleted successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete project.")

@app.post("/projects/{project_id}/apply-changes", response_model=models.ApiResponse[models.ProjectOut], status_code=200)
async def apply_changes_to_project(
    project_id: str,
    request_body: ApplyChangesRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        await apply_transcript_changes(db=db, project_id=project_id, changes=request_body.changes)
        
        # Refresh project data after changes
        db.refresh(project)

        response_project = map_project_to_response(project, str(http_request.base_url))
        return models.ApiResponse(data=response_project, message="Changes applied successfully.")

    except Exception as e:
        logger.error(f"Failed to apply changes to project {project_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to apply changes: {str(e)}")

@app.get("/projects/{project_id}/transcripts", response_model=models.ApiResponse[models.TranscriptionOut])
def get_project_transcripts(
    project_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(auth.get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Sort transcription lines by line_index
    sorted_lines = sorted(project.transcription_lines, key=lambda x: x.line_index)
    
    segments = [models.TranscriptionLineOut.from_orm(line) for line in sorted_lines]

    transcription_out = models.TranscriptionOut(
        id=project.id,
        projectId=project.id,
        segments=segments,
        status=project.status,
        language=None, # Not available yet
        createdAt=project.created_at,
        updatedAt=project.updated_at
    )
    
    return models.ApiResponse(data=transcription_out)

@app.put("/transcripts/{transcript_id}", response_model=models.TranscriptionLineOut)
def update_transcript_text(
    transcript_id: str,
    transcript_update: models.TranscriptionLineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Step 4: User selects words in sentences and asks for edits.
    """
    db_transcript = db.query(TranscriptionLine).get(transcript_id)
    if not db_transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")

    project = db.query(Project).filter(
        Project.id == db_transcript.project_id, 
        Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=403, detail="Not authorized to edit this transcript")

    db_transcript.text = transcript_update.text
    db.commit()
    db.refresh(db_transcript)
    return db_transcript

@app.post("/projects/{project_id}/edit-requests", response_model=models.EditRequestOut)
def create_edit_request(
    project_id: str,
    edit_request: models.EditRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Step 4: Create an edit request for word replacement.
    """
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify the transcription line belongs to this project
    transcript_line = db.query(TranscriptionLine).filter(
        TranscriptionLine.id == edit_request.transcription_line_id,
        TranscriptionLine.project_id == project_id
    ).first()
    if not transcript_line:
        raise HTTPException(status_code=404, detail="Transcription line not found")

    # Create edit request
    db_edit_request = EditRequest(
        project_id=project_id,
        transcription_line_id=edit_request.transcription_line_id,
        source_word=edit_request.source_word,
        target_word=edit_request.target_word
    )
    db.add(db_edit_request)
    db.commit()
    db.refresh(db_edit_request)
    
    return db_edit_request

@app.post("/projects/{project_id}/regenerate-audio")
async def regenerate_audio_and_replace_in_video(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Step 5 & 6: Make a call to ElevenLabs, get new audio, and update the video.
    """
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 1. Combine all transcript texts
    transcription_lines = sorted(project.transcription_lines, key=lambda x: x.line_index)
    full_text = " ".join([t.text for t in transcription_lines])

    # 2. Generate new audio with ElevenLabs
    elevenlabs_service = ElevenLabsService()
    try:
        from core.config import config
        new_audio_data = await elevenlabs_service.generate_speech(
            text=full_text,
            voice_id=config.VOICE_ID
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate audio from ElevenLabs: {e}")

    new_audio_path = f"outputs/{uuid.uuid4()}_new_audio.mp3"
    with open(new_audio_path, 'wb') as f:
        f.write(new_audio_data)

    # 3. Create AudioFile record for generated audio
    audio_file = AudioFile(
        project_id=project_id,
        file_path=new_audio_path,
        type=AudioType.generated
    )
    db.add(audio_file)
    db.commit()

    # 4. Replace audio in the original video
    video_replacer = VideoAudioReplacer()
    output_video_path = f"outputs/{uuid.uuid4()}_final_video.mp4"
    
    final_video_path = video_replacer.replace_audio(
        video_path=project.video.file_path,
        new_audio_path=new_audio_path,
        output_path=output_video_path
    )

    return {"message": "Audio regenerated and video updated.", "video_path": final_video_path}

@app.get("/projects/{project_id}/video")
def get_project_video(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Serve the video file for a specific project.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.video or not project.video.file_path:
        raise HTTPException(status_code=404, detail="Video file not found")
    
    if not os.path.exists(project.video.file_path):
        raise HTTPException(status_code=404, detail="Video file does not exist on disk")
    
    return FileResponse(
        path=project.video.file_path,
        media_type=project.mime_type or "video/mp4",
        filename=project.video_filename or f"video_{project_id}.mp4"
    )

@app.get("/projects/{project_id}/thumbnail")
def get_project_thumbnail(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    Serve the thumbnail image for a specific project.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.thumbnail_path:
        raise HTTPException(status_code=404, detail="Thumbnail not generated yet")
    
    if not os.path.exists(project.thumbnail_path):
        raise HTTPException(status_code=404, detail="Thumbnail file does not exist on disk")
    
    return FileResponse(
        path=project.thumbnail_path,
        media_type="image/jpeg",
        filename=f"thumbnail_{project_id}.jpg"
    )

@app.get("/projects/{project_id}/edit-requests", response_model=List[models.EditRequestOut])
def get_project_edit_requests(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Get all edit requests for a project.
    """
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.owner_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project.edits

@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload audio or video file"""
    try:
        # Validate file type
        allowed_types = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'video/mp4', 'video/quicktime']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        file_path = f"uploads/{file_id}{file_extension}"
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process file to get metadata
        metadata = audio_processor.get_file_metadata(file_path)
        file_size = len(content)
        
        # Store file info
        file_info = {
            "file_id": file_id,
            "original_name": file.filename,
            "file_path": file_path,
            "content_type": file.content_type,
            "duration": metadata.get("duration", 0),
            "sample_rate": metadata.get("sample_rate", 44100)
        }
        
        # Save metadata
        with open(f"temp/{file_id}_metadata.json", "w") as f:
            json.dump(file_info, f)
        
        logger.info(f"File uploaded successfully: {file_id}")
        
        from datetime import datetime
        return UploadResponse(
            file_id=file_id,
            original_name=file.filename,
            duration=metadata.get("duration", 0),
            sample_rate=metadata.get("sample_rate", 44100),
            file_size=file_size,
            created_at=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/waveform/{file_id}")
async def get_waveform(file_id: str, resolution: int = 1000):
    """Generate waveform data for audio visualization"""
    try:
        # Load file metadata
        metadata_path = f"temp/{file_id}_metadata.json"
        if not os.path.exists(metadata_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(metadata_path, "r") as f:
            file_info = json.load(f)
        
        # Generate waveform
        waveform_data = audio_processor.generate_waveform(file_info["file_path"], resolution)
        
        return {
            "file_id": file_id,
            "waveform_data": waveform_data,
            "resolution": resolution,
            "duration": file_info["duration"]
        }
        
    except Exception as e:
        logger.error(f"Waveform generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Waveform generation failed: {str(e)}")

@app.get("/voices")
async def get_voices():
    """Get available ElevenLabs voices"""
    try:
        voices = await elevenlabs_service.get_voices()
        return {"voices": voices}
    except Exception as e:
        logger.error(f"Voice fetching error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch voices: {str(e)}")

@app.post("/text-to-speech")
async def generate_speech(request: TTSRequest):
    """Generate speech using ElevenLabs TTS"""
    try:
        # Generate TTS audio
        audio_data = await elevenlabs_service.generate_speech(
            text=request.text,
            voice_id=request.voice_id,
            voice_settings=request.voice_settings
        )
        
        # Save generated audio
        tts_id = str(uuid.uuid4())
        tts_path = f"temp/{tts_id}.mp3"
        
        with open(tts_path, "wb") as f:
            f.write(audio_data)
        
        # Get duration
        metadata = audio_processor.get_file_metadata(tts_path)
        
        return {
            "tts_id": tts_id,
            "duration": metadata.get("duration", 0),
            "file_path": tts_path
        }
        
    except Exception as e:
        logger.error(f"TTS generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

@app.post("/replace-segment")
async def replace_audio_segment(request: ReplaceSegmentRequest):
    """Replace audio segment with TTS-generated audio"""
    try:
        # Load original file metadata
        metadata_path = f"temp/{request.file_id}_metadata.json"
        if not os.path.exists(metadata_path):
            raise HTTPException(status_code=404, detail="Original file not found")
        
        with open(metadata_path, "r") as f:
            file_info = json.load(f)
        
        # Check if TTS file exists
        tts_path = f"temp/{request.tts_id}.mp3"
        if not os.path.exists(tts_path):
            raise HTTPException(status_code=404, detail="TTS audio not found")
        
        # Process segment replacement
        output_id = str(uuid.uuid4())
        output_path = f"outputs/{output_id}.mp3"
        
        audio_processor.replace_segment(
            original_path=file_info["file_path"],
            replacement_path=tts_path,
            start_time=request.start_time,
            end_time=request.end_time,
            output_path=output_path
        )
        
        # Get output metadata
        output_metadata = audio_processor.get_file_metadata(output_path)
        
        return {
            "output_id": output_id,
            "output_path": output_path,
            "duration": output_metadata.get("duration", 0),
            "message": "Segment replaced successfully"
        }
        
    except Exception as e:
        logger.error(f"Segment replacement error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Segment replacement failed: {str(e)}")

@app.get("/download/{file_id}")
async def download_file(file_id: str):
    """Download processed audio file"""
    try:
        file_path = f"outputs/{file_id}.mp3"
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            path=file_path,
            filename=f"edited_audio_{file_id}.mp3",
            media_type="audio/mpeg"
        )
        
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.post("/video-audio-replace")
async def replace_video_audio(request: VideoAudioReplaceRequest):
    """Replace audio in video file"""
    try:
        # Load video file metadata
        video_metadata_path = f"temp/{request.video_file_id}_metadata.json"
        if not os.path.exists(video_metadata_path):
            raise HTTPException(status_code=404, detail="Video file not found")
        
        with open(video_metadata_path, "r") as f:
            video_info = json.load(f)
        
        # Get audio file path
        audio_path = f"outputs/{request.audio_file_id}.mp3"
        if not os.path.exists(audio_path):
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        # Process video-audio replacement
        output_id = str(uuid.uuid4())
        output_path = f"outputs/{output_id}.mp4"
        
        audio_processor.replace_video_audio(
            video_path=video_info["file_path"],
            audio_path=audio_path,
            output_path=output_path
        )
        
        return {
            "output_id": output_id,
            "output_path": output_path,
            "message": "Video audio replaced successfully"
        }
        
    except Exception as e:
        logger.error(f"Video audio replacement error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Video audio replacement failed: {str(e)}")

@app.delete("/cleanup/{file_id}")
async def cleanup_temp_files(file_id: str):
    """
    (Optional) Endpoint to clean up temporary files associated with a file_id.
    """
    try:
        # Find all files with this file_id prefix and delete them
        for f in os.listdir("temp"):
            if f.startswith(file_id):
                os.remove(os.path.join("temp", f))
        for f in os.listdir("outputs"):
            if f.startswith(file_id):
                os.remove(os.path.join("outputs", f))
        
        return {"message": "Cleanup successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 