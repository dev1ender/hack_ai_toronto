import argparse
import os
from moviepy.editor import VideoFileClip, AudioFileClip

def replace_video_audio(video_path, audio_path, output_path):
    """
    Replaces the audio of a video file with a new one.

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
        video_clip = VideoFileClip(video_path)
        audio_clip = AudioFileClip(audio_path)

        video_with_new_audio = video_clip.set_audio(audio_clip)
        video_with_new_audio.write_videofile(output_path, codec='libx264', audio_codec='aac')

        video_clip.close()
        audio_clip.close()
        video_with_new_audio.close()
        
        print(f"✅ Audio replaced successfully and saved to {output_path}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Replace the audio of a video with a new one.")
    parser.add_argument(
        "--video_path",
        type=str,
        default="resources/video_man.mp4",
        help="Path to the input video file."
    )
    parser.add_argument(
        "--audio_path",
        type=str,
        default="resources/audio_man.mp3",
        help="Path to the new audio file."
    )
    parser.add_argument(
        "--output_path",
        type=str,
        default="resources/video_with_new_audio.mp4",
        help="Path to save the output video file."
    )
    args = parser.parse_args()

    replace_video_audio(args.video_path, args.audio_path, args.output_path) 