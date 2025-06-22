import uuid
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any, TypeVar, Generic
from enum import Enum
from datetime import datetime

# === User and Auth Models ===
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserOut(BaseModel):
    id: uuid.UUID
    username: Optional[str] = None
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str = "user"
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserOut

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    error: Optional[str] = None
    message: Optional[str] = None

# === Project Models ===
class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None

class ProjectOut(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None  # in seconds
    file_size: Optional[int] = None  # in bytes
    mime_type: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    user_id: uuid.UUID

    class Config:
        from_attributes = True

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class ProjectFilters(BaseModel):
    status: Optional[str] = None
    search: Optional[str] = None
    sortBy: Optional[str] = "createdAt"
    sortOrder: Optional[str] = "desc"

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    pageSize: int
    totalPages: int

class Project(BaseModel):
    id: str
    video_url: Optional[str] = None
    transcript_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    username: Optional[str] = None

    class Config:
        orm_mode = True

class TranscriptionLineOut(BaseModel):
    id: uuid.UUID
    text: str
    startTime: Optional[float] = Field(None, alias="start_time")
    endTime: Optional[float] = Field(None, alias="end_time")
    speaker: str = "Speaker" # Placeholder

    class Config:
        from_attributes = True
        populate_by_name = True
        allow_population_by_field_name = True

class TranscriptionOut(BaseModel):
    id: uuid.UUID
    projectId: uuid.UUID
    segments: List[TranscriptionLineOut]
    status: str
    language: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

class TranscriptionLineUpdate(BaseModel):
    text: str

# === Transcription Changes ===
class TranscriptChange(BaseModel):
    id: str
    transcript_id: str = Field(..., alias="transcriptId")
    timestamp: str
    old_text: str = Field(..., alias="oldText")
    new_text: str = Field(..., alias="newText")
    start_index: int = Field(..., alias="startIndex")
    end_index: int = Field(..., alias="endIndex")
    change_time: str = Field(..., alias="changeTime")

class ApplyChangesRequest(BaseModel):
    changes: List[TranscriptChange]

# === Edit Request Models ===
class EditRequestCreate(BaseModel):
    transcription_line_id: uuid.UUID
    source_word: str
    target_word: str

class EditRequestOut(BaseModel):
    id: uuid.UUID
    source_word: str
    target_word: str
    status: str
    requested_at: datetime
    completed_at: Optional[datetime] = None
    new_audio_path: Optional[str] = None
    
    class Config:
        from_attributes = True

# === ElevenLabs Models ===
class VoiceSettings(BaseModel):
    stability: float = 0.5
    similarity_boost: float = 0.75
    style: float = 0.0
    use_speaker_boost: bool = True
    speed: float = 1.0

class TTSRequest(BaseModel):
    text: str
    voice_id: str = None  # Will be set from config if not provided
    voice_settings: Optional[VoiceSettings] = None
    
    def __init__(self, **data):
        super().__init__(**data)
        if self.voice_id is None:
            from core.config import config
            self.voice_id = config.VOICE_ID

# === Legacy Models (keeping for compatibility) ===
class UploadResponse(BaseModel):
    file_id: str
    original_name: str
    duration: float
    sample_rate: int
    file_size: int
    created_at: datetime

class ReplaceSegmentRequest(BaseModel):
    file_id: str
    tts_id: str
    start_time: float
    end_time: float

class VideoAudioReplaceRequest(BaseModel):
    video_file_id: str
    audio_file_id: str

class Voice(BaseModel):
    voice_id: str
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    preview_url: Optional[str] = None

class FileMetadata(BaseModel):
    file_id: str
    original_name: str
    file_path: str
    content_type: str
    duration: float
    sample_rate: int
    file_size: int
    created_at: datetime

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class EditResult(BaseModel):
    output_id: str
    output_path: str
    duration: float
    message: str
    status: ProcessingStatus = ProcessingStatus.COMPLETED 