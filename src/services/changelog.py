import os
import uuid
from sqlalchemy.orm import Session
from moviepy.editor import AudioFileClip, VideoFileClip, CompositeAudioClip, concatenate_audioclips
from models.database import Project, TranscriptionLine, AudioFile, AudioType, Video
from models.api import TranscriptChange
from typing import List
from services.elevenlabs import ElevenLabsService
from services.audio import AudioProcessor
from services.transcript import TranscriptGenerator
from core.config import config

async def apply_transcript_changes(db: Session, project_id: str, changes: List[TranscriptChange]):
    """
    Applies transcript changes to a project.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise Exception("Project not found")

    original_audio_file = db.query(AudioFile).filter(
        AudioFile.project_id == project_id,
        AudioFile.type == AudioType.extracted
    ).first()
    if not original_audio_file:
        raise Exception("Original audio file not found for the project")

    print("Re-transcribing audio to get word-level timestamps...")
    transcript_generator = TranscriptGenerator()
    full_transcript = transcript_generator.generate_transcript(
        original_audio_file.file_path, 
        get_word_timestamps=True
    )
    if not full_transcript or not full_transcript.words:
        raise Exception("Could not retrieve word-level timestamps.")
        
    all_words = full_transcript.words
    
    # Create a map from transcript line ID to the line object
    lines_map = {str(line.id): line for line in project.transcription_lines}

    # Group changes by transcript line ID to avoid duplicate processing
    changes_by_line = {}
    for change in changes:
        line_id = change.transcript_id
        if line_id not in changes_by_line:
            changes_by_line[line_id] = []
        changes_by_line[line_id].append(change)

    print(f"Processing {len(changes)} changes across {len(changes_by_line)} transcript lines")

    elevenlabs_service = ElevenLabsService()
    new_audio_segments = []
    temp_files = []

    # Process each line only once, applying all changes to that line
    for line_id, line_changes in changes_by_line.items():
        line = lines_map.get(line_id)
        if not line:
            print(f"Warning: Could not find transcript line for changes in line {line_id}")
            continue

        # Use the start and end time of the entire line
        start_time = line.start_time
        end_time = line.end_time

        if start_time is None or end_time is None:
            print(f"Warning: Could not determine timestamp for line {line_id}")
            continue

        # Apply all changes to this line at once
        new_line_text = line.text
        for change in line_changes:
            print(f"Applying change {change.id}: '{change.old_text}' -> '{change.new_text}'")
            new_line_text = new_line_text.replace(change.old_text, change.new_text)

        # Update the transcript line in the database
        line.text = new_line_text
        print(f"Updated transcript line {line_id} with {len(line_changes)} changes: '{new_line_text}'")

        # Generate audio only once for this line with all changes applied
        print(f"Generating audio for line {line_id}: '{new_line_text}'")
        try:
            audio_bytes = await elevenlabs_service.generate_speech(
                text=new_line_text,
                voice_id=config.VOICE_ID
            )
            
            temp_dir = "temp"
            if not os.path.exists(temp_dir):
                os.makedirs(temp_dir)

            new_audio_path = os.path.join(temp_dir, f"{uuid.uuid4()}.mp3")
            with open(new_audio_path, "wb") as f:
                f.write(audio_bytes)
            temp_files.append(new_audio_path)

            # Create single audio segment for this line
            new_audio_segments.append({
                "path": new_audio_path,
                "start_time": start_time,
                "end_time": end_time,
            })

        except Exception as e:
            print(f"Warning: Could not generate audio for line {line_id} '{new_line_text}': {e}")
            continue

    print(f"Generated {len(new_audio_segments)} new audio clips for {len(changes_by_line)} modified lines.")

    # Commit transcript text changes to database even if no audio was generated
    db.commit()
    print("Transcript changes saved to database.")

    if not new_audio_segments:
        print("No audio changes to apply.")
        return {"message": "Transcript changes applied successfully (no audio generation needed)."}

    # Sort segments by start time to process them in order
    new_audio_segments.sort(key=lambda x: x['start_time'])
    
    original_clip = AudioFileClip(original_audio_file.file_path)
    final_clips = []
    last_end_time = 0

    for segment in new_audio_segments:
        # Add the portion of original audio before the current change
        if segment['start_time'] > last_end_time:
            final_clips.append(original_clip.subclip(last_end_time, segment['start_time']))
        
        # Add the new audio clip
        new_audio_clip = AudioFileClip(segment['path'])
        final_clips.append(new_audio_clip)
        
        last_end_time = segment['end_time']

    # Add the remaining part of the original audio
    if last_end_time < original_clip.duration:
        final_clips.append(original_clip.subclip(last_end_time))

    # Concatenate all clips to form the new audio track
    final_audio = concatenate_audioclips(final_clips)
    
    new_audio_filename = f"final_audio_{project.id}.mp3"
    new_audio_path = os.path.join("outputs", new_audio_filename)
    final_audio.write_audiofile(new_audio_path)

    # Replace audio in the original video
    original_video_path = project.video.file_path
    video_clip = VideoFileClip(original_video_path)
    video_clip = video_clip.set_audio(final_audio)
    
    new_video_filename = f"final_video_{project.id}.mp4"
    new_video_path = os.path.join("outputs", new_video_filename)
    video_clip.write_videofile(new_video_path)

    # Update project with new video
    project.video.file_path = new_video_path
    
    # Commit all database changes (transcript updates and video path update)
    db.commit()
    print("Database updated with transcript changes and new video path.")

    # Clean up temporary audio files
    for file_path in temp_files:
        try:
            os.remove(file_path)
        except OSError as e:
            print(f"Error deleting temp file {file_path}: {e}")

    print(f"Successfully generated new video: {new_video_path}")
    return {"message": "Changes applied and new video generated successfully."} 