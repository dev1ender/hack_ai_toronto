import uuid
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base
import enum

# Authentication/User model
class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    role = Column(String(20), default="user", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    projects = relationship("Project", back_populates="owner")

# Project to group uploads and related data
class Project(Base):
    __tablename__ = 'projects'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)  # Will map to 'title' in API
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default='pending')  # e.g., pending, processing, completed
    video_filename = Column(String(255), nullable=True)  # temp storage path or filename
    thumbnail_path = Column(String(512), nullable=True)  # path to generated thumbnail image
    duration = Column(Float, nullable=True)  # in seconds
    file_size = Column(Integer, nullable=True)  # in bytes  
    mime_type = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    owner = relationship("User", back_populates="projects")
    video = relationship("Video", uselist=False, back_populates="project")
    transcription_lines = relationship("TranscriptionLine", back_populates="project", cascade="all, delete-orphan")
    edits = relationship("EditRequest", back_populates="project", cascade="all, delete-orphan")
    audio_files = relationship("AudioFile", back_populates="project", cascade="all, delete-orphan")

# Video file model
class Video(Base):
    __tablename__ = 'videos'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, unique=True)
    file_path = Column(String(512), nullable=False)  # actual file path in storage
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="video")

# Audio file types (extracted from video, or final merged audio)
class AudioType(enum.Enum):
    extracted = "extracted"
    generated = "generated"
    edited = "edited"

# Audio files model for storing extracted or generated audio
class AudioFile(Base):
    __tablename__ = 'audio_files'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    file_path = Column(String(512), nullable=False)
    type = Column(Enum(AudioType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="audio_files")
    segments = relationship("AudioSegment", back_populates="audio_file", cascade="all, delete-orphan")

# Optional: Audio segments per transcription line
class AudioSegment(Base):
    __tablename__ = 'audio_segments'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audio_file_id = Column(UUID(as_uuid=True), ForeignKey('audio_files.id', ondelete='CASCADE'), nullable=False)
    transcription_line_id = Column(UUID(as_uuid=True), ForeignKey('transcription_lines.id', ondelete='CASCADE'), nullable=False)
    file_path = Column(String(512), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    audio_file = relationship("AudioFile", back_populates="segments")
    transcription_line = relationship("TranscriptionLine", back_populates="audio_segments")

# Transcription line model: each line of transcript
class TranscriptionLine(Base):
    __tablename__ = 'transcription_lines'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    line_index = Column(Integer, nullable=False)  # order index in transcript
    text = Column(Text, nullable=False)
    start_time = Column(Float, nullable=True)  # timestamp in seconds
    end_time = Column(Float, nullable=True)
    words = Column(JSONB, nullable=True)  # To store word-level timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship("Project", back_populates="transcription_lines")
    audio_segments = relationship("AudioSegment", back_populates="transcription_line", cascade="all, delete-orphan")
    edits = relationship("EditRequest", back_populates="transcription_line", cascade="all, delete-orphan")

# Edit requests by user for a given transcription line
class EditRequest(Base):
    __tablename__ = 'edit_requests'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    transcription_line_id = Column(UUID(as_uuid=True), ForeignKey('transcription_lines.id', ondelete='CASCADE'), nullable=False)
    source_word = Column(String(255), nullable=False)
    target_word = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default='pending')  # pending, processing, completed, failed
    requested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    new_audio_path = Column(String(512), nullable=True)  # path to the newly generated audio for this line

    project = relationship("Project", back_populates="edits")
    transcription_line = relationship("TranscriptionLine", back_populates="edits") 