import os
import openai
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

class TranscriptGenerator:
    def __init__(self):
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set.")
        openai.api_key = api_key

    def generate_transcript(self, audio_path: str, get_word_timestamps: bool = False):
        """
        Generates a transcript for an audio file using OpenAI's Whisper API.

        Args:
            audio_path (str): The path to the input audio file.
            get_word_timestamps (bool): Whether to request word-level timestamps.

        Returns:
            OpenAI transcript object with segments containing start, end, and text.
        """
        if not os.path.exists(audio_path):
            logger.error(f"Audio file not found at {audio_path}")
            return None

        try:
            with open(audio_path, "rb") as audio_file:
                logger.info("Generating transcript with OpenAI Whisper...")
                
                # Always request verbose_json to get segment timestamps
                params = {
                    "model": "whisper-1",
                    "file": audio_file,
                    "response_format": "verbose_json",
                    "timestamp_granularities": ["segment"]  # Always request segment timestamps
                }
                
                if get_word_timestamps:
                    logger.info("Also requesting word-level timestamps...")
                    params["timestamp_granularities"] = ["word", "segment"]

                transcript = openai.audio.transcriptions.create(**params)
                
                # Log for debugging
                logger.info(f"Transcript generated successfully with {len(transcript.segments)} segments")
                for i, segment in enumerate(transcript.segments[:2]):  # Log first 2 segments for debugging
                    try:
                        # Handle both object and dictionary formats
                        if hasattr(segment, 'start'):
                            # Object format
                            start_time = segment.start
                            end_time = segment.end
                            text = segment.text
                        else:
                            # Dictionary format
                            start_time = segment.get('start', 'N/A')
                            end_time = segment.get('end', 'N/A')
                            text = segment.get('text', 'N/A')
                        
                        logger.info(f"Segment {i}: start={start_time}s, end={end_time}s, text='{str(text)[:50]}...'")
                        logger.info(f"Segment {i} type: {type(segment)}, keys: {list(segment.keys()) if isinstance(segment, dict) else 'N/A'}")
                    except Exception as e:
                        logger.error(f"Error logging segment {i}: {e}")
                        logger.error(f"Segment content: {segment}")
            
            return transcript

        except Exception as e:
            logger.error(f"Error during transcript generation: {e}")
            return None 