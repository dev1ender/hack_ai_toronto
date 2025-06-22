import asyncio
import os
import re
from dotenv import load_dotenv
import sys
import time

# Add src directory to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.elevenlabs import ElevenLabsService
from services.audio import AudioProcessor
from core.config import config


async def process_changes(audio_path, transcript_path, changes, output_path):
    """
    Processes changes in a transcript and applies them to an audio file.

    Args:
        audio_path (str): Path to the original audio file.
        transcript_path (str): Path to the transcript file.
        changes (dict): A dictionary with the original text as key and new text as value.
        output_path (str): Path to save the modified audio file.
    """
    load_dotenv()
    elevenlabs_service = ElevenLabsService()
    audio_processor = AudioProcessor()

    with open(transcript_path, "r") as f:
        transcript_lines = f.readlines()

    original_text_to_find = list(changes.keys())[0]
    new_text = list(changes.values())[0]

    for line in transcript_lines:
        if original_text_to_find in line:
            match = re.search(r'\[(\d+\.\d+)s - (\d+\.\d+)s\]', line)
            if match:
                start_time = float(match.group(1))
                end_time = float(match.group(2))
                print(f"Found segment to replace from {start_time}s to {end_time}s.")
                print(f"Original text: {original_text_to_find}")
                print(f"New text: {new_text}")

                # 1. Generate new audio from text
                print("Generating new audio using ElevenLabs...")
                voice_id = config.VOICE_ID
                try:
                    new_audio_data = await elevenlabs_service.generate_speech(
                        text=new_text,
                        voice_id=voice_id
                    )
                except Exception as e:
                    print(f"Error calling ElevenLabs API: {e}")
                    # Check for missing API key
                    if "ELEVENLABS_API_KEY" in str(e):
                        print("Please make sure your ELEVENLABS_API_KEY is set in a .env file.")
                    return

                temp_audio_path = "temp/temp_new_audio.mp3"
                with open(temp_audio_path, "wb") as f:
                    f.write(new_audio_data)
                print(f"New audio saved to {temp_audio_path}")

                # 2. Replace audio segment
                print("Replacing audio segment...")
                try:
                    audio_processor.replace_segment(
                        original_path=audio_path,
                        replacement_path=temp_audio_path,
                        start_time=start_time,
                        end_time=end_time,
                        output_path=output_path,
                    )
                    print(f"✅ Audio processing complete. Output saved to {output_path}")
                except Exception as e:
                    print(f"Error during audio replacement: {e}")
                finally:
                    # Clean up temporary file
                    if os.path.exists(temp_audio_path):
                        os.remove(temp_audio_path)
                return

    print(f"Could not find the text '{original_text_to_find}' in the transcript.")


if __name__ == "__main__":
    AUDIO_FILE = "src/video/audio_man.mp3"
    TRANSCRIPT_FILE = "src/video/transcript.txt"
    
    OUTPUT_FILE = f"src/video/audio_man_modified_{int(time.time())}.mp3"

    # The change requested by the user
    CHANGES_TO_APPLY = {
        "Because that's this guy's sub, I should order one.": "because thats this subway sub, I should not order one"
    }

    # Ensure temp directory exists
    if not os.path.exists("temp"):
        os.makedirs("temp")

    asyncio.run(process_changes(AUDIO_FILE, TRANSCRIPT_FILE, CHANGES_TO_APPLY, OUTPUT_FILE)) 