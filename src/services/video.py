import argparse
import os
import subprocess
import logging

logger = logging.getLogger(__name__)

class VideoAudioReplacer:
    @staticmethod
    def replace_audio(video_path, audio_path, output_path):
        """
        Replaces the audio of a video file with a new one using ffmpeg.
        """
        return replace_video_audio(video_path, audio_path, output_path)

    @staticmethod
    def generate_thumbnail(video_path, output_path, time_offset="00:00:00"):
        """
        Generates a thumbnail image from the first frame of a video using ffmpeg.
        
        Args:
            video_path (str): The path to the input video file.
            output_path (str): The path to save the thumbnail image.
            time_offset (str): Time offset to extract frame from (default: first frame)
        
        Returns:
            str: Path to the generated thumbnail or None if failed
        """
        return generate_video_thumbnail(video_path, output_path, time_offset)

def generate_video_thumbnail(video_path, output_path, time_offset="00:00:00"):
    """
    Generates a thumbnail image from a video file using ffmpeg.

    Args:
        video_path (str): The path to the input video file.
        output_path (str): The path to save the thumbnail image.
        time_offset (str): Time offset to extract frame from (default: first frame)
        
    Returns:
        str: Path to the generated thumbnail or None if failed
    """
    if not os.path.exists(video_path):
        logger.error(f"Video file not found at {video_path}")
        return None

    try:
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        command = [
            'ffmpeg',
            '-y',  # Overwrite output file if it exists
            '-i', video_path,
            '-ss', time_offset,  # Seek to time offset
            '-vframes', '1',  # Extract only one frame
            '-q:v', '2',  # High quality
            '-vf', 'scale=320:240',  # Resize to thumbnail size
            output_path
        ]
        
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        logger.info(f"✅ Thumbnail generated successfully and saved to {output_path}")
        return output_path

    except FileNotFoundError:
        logger.error("Error: ffmpeg is not installed or not in your PATH. Please install ffmpeg.")
        return None
    except subprocess.CalledProcessError as e:
        logger.error(f"An error occurred with ffmpeg: {e.stderr}")
        return None
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return None

def replace_video_audio(video_path, audio_path, output_path):
    """
    Replaces the audio of a video file with a new one using ffmpeg.

    Args:
        video_path (str): The path to the input video file.
        audio_path (str): The path to the new audio file.
        output_path (str): The path to save the output video file.
    """
    if not os.path.exists(video_path):
        print(f"Error: Video file not found at {video_path}")
        return

    if not os.path.exists(audio_path):
        print(f"Error: Audio file not found at {audio_path}")
        return

    try:
        command = [
            'ffmpeg',
            '-y',  # Overwrite output file if it exists
            '-i', video_path,
            '-i', audio_path,
            '-c:v', 'copy',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-shortest',
            output_path
        ]
        
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        print(f"✅ Audio replaced successfully and saved to {output_path}")

    except FileNotFoundError:
        print("Error: ffmpeg is not installed or not in your PATH. Please install ffmpeg.")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred with ffmpeg:")
        print(e.stderr)
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    output_path = "src/video/video_with_new_audio_1750541337.mp4"
    video_path = "src/video/video_man.mp4"
    audio_path = "src/video/audio_man_modified_1750541337.mp3"
    replace_video_audio(video_path, audio_path, output_path) 