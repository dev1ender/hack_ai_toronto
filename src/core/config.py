import os
from typing import Optional

class Config:
    # ElevenLabs API Configuration
    ELEVENLABS_API_KEY: Optional[str] = os.getenv("ELEVENLABS_API_KEY")
    VOICE_ID: str = os.getenv("VOICE_ID", "nPczCjzI2devNBz1zQrb")  # Default to Rachel voice
    
    # OpenAI API Configuration (if needed)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # File Storage Configuration
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
    TEMP_DIR: str = os.getenv("TEMP_DIR", "temp")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    OUTPUT_DIR: str = os.getenv("OUTPUT_DIR", "outputs")
    
    # Audio Processing Configuration
    DEFAULT_SAMPLE_RATE: int = int(os.getenv("DEFAULT_SAMPLE_RATE", "44100"))
    WAVEFORM_RESOLUTION: int = int(os.getenv("WAVEFORM_RESOLUTION", "1000"))
    MAX_AUDIO_DURATION_SECONDS: int = int(os.getenv("MAX_AUDIO_DURATION_SECONDS", "3600"))
    
    # Allowed file types
    ALLOWED_AUDIO_TYPES = [
        "audio/mp3", "audio/wav", "audio/mpeg", "audio/ogg", 
        "audio/flac", "audio/aac", "audio/x-wav"
    ]
    
    ALLOWED_VIDEO_TYPES = [
        "video/mp4", "video/quicktime", "video/x-msvideo", 
        "video/webm", "video/avi"
    ]
    
    @classmethod
    def get_all_allowed_types(cls):
        return cls.ALLOWED_AUDIO_TYPES + cls.ALLOWED_VIDEO_TYPES

# Global config instance
config = Config() 