import os
import httpx
import asyncio
from typing import List, Dict, Any, Optional
import logging
from models.api import Voice, VoiceSettings
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class ElevenLabsService:
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY environment variable is required")
        
        self.base_url = "https://api.elevenlabs.io/v1"
        self.headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
    
    async def get_voices(self) -> List[Voice]:
        """Get available voices from ElevenLabs"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/voices",
                    headers={"xi-api-key": self.api_key}
                )
                response.raise_for_status()
                
                data = response.json()
                voices = []
                
                for voice_data in data.get("voices", []):
                    voice = Voice(
                        voice_id=voice_data["voice_id"],
                        name=voice_data["name"],
                        category=voice_data.get("category"),
                        description=voice_data.get("description"),
                        preview_url=voice_data.get("preview_url")
                    )
                    voices.append(voice)
                
                logger.info(f"Fetched {len(voices)} voices from ElevenLabs")
                return voices
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching voices: {e}")
            return self.get_default_voices()
        except Exception as e:
            logger.error(f"Error fetching voices: {e}")
            return self.get_default_voices()
    
    def get_default_voices(self) -> List[Voice]:
        """Return default voices as fallback"""
        return [
            Voice(
                voice_id="nPczCjzI2devNBz1zQrb",
                name="Rachel",
                category="premade",
                description="Calm, young adult female"
            ),
            Voice(
                voice_id="AZnzlk1XvdvUeBnXmlld",
                name="Domi",
                category="premade",
                description="Strong, confident female"
            ),
            Voice(
                voice_id="EXAVITQu4vr4xnSDxMaL",
                name="Bella",
                category="premade",
                description="Soft, gentle female"
            ),
            Voice(
                voice_id="ErXwobaYiN019PkySvjV",
                name="Antoni",
                category="premade",
                description="Well-rounded, young male"
            ),
            Voice(
                voice_id="VR6AewLTigWG4xSOukaG",
                name="Arnold",
                category="premade",
                description="Crisp, middle-aged male"
            )
        ]
    
    async def generate_speech(
        self,
        text: str,
        voice_id: str,
        model_id: str = "eleven_multilingual_v2",
        voice_settings: Optional[VoiceSettings] = None
    ) -> bytes:
        """Generate speech using ElevenLabs TTS"""
        try:
            if not voice_settings:
                voice_settings = VoiceSettings()
            
            # Validate input
            if not text or len(text.strip()) == 0:
                raise ValueError("Text cannot be empty")
            
            if len(text) > 40000:
                raise ValueError("Text exceeds maximum length of 40,000 characters")
            
            request_body = {
                "text": text,
                "model_id": model_id,
                "voice_settings": {
                    "stability": voice_settings.stability,
                    "similarity_boost": voice_settings.similarity_boost,
                    "style": voice_settings.style,
                    "use_speaker_boost": voice_settings.use_speaker_boost,
                    "speed": voice_settings.speed
                }
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/text-to-speech/{voice_id}",
                    headers=self.headers,
                    json=request_body
                )
                
                if response.status_code == 429:
                    # Rate limiting - wait and retry once
                    await asyncio.sleep(2)
                    response = await client.post(
                        f"{self.base_url}/text-to-speech/{voice_id}",
                        headers=self.headers,
                        json=request_body
                    )
                
                response.raise_for_status()
                
                logger.info(f"Generated speech for text length: {len(text)} characters")
                return response.content
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error generating speech: {e}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response content: {e.response.text}")
            raise Exception(f"TTS generation failed: {str(e)}")
        except Exception as e:
            logger.error(f"Error generating speech: {e}")
            raise Exception(f"TTS generation failed: {str(e)}")
    
    async def generate_speech_with_retry(
        self,
        text: str,
        voice_id: str,
        model_id: str = "eleven_multilingual_v2",
        voice_settings: Optional[VoiceSettings] = None,
        max_retries: int = 3
    ) -> bytes:
        """Generate speech with retry logic"""
        for attempt in range(max_retries):
            try:
                return await self.generate_speech(text, voice_id, model_id, voice_settings)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                
                wait_time = 2 ** attempt  # Exponential backoff
                logger.warning(f"TTS attempt {attempt + 1} failed, retrying in {wait_time}s: {e}")
                await asyncio.sleep(wait_time)
        
        raise Exception("All TTS retry attempts failed")
    
    def validate_voice_id(self, voice_id: str) -> bool:
        """Validate if voice ID exists in default voices"""
        default_voice_ids = [voice.voice_id for voice in self.get_default_voices()]
        return voice_id in default_voice_ids 