import argparse
import subprocess
from rich.console import Console

console = Console()


def trim_audio(input_file: str, output_file: str, start_time: str, end_time: str):
    """
    Trims an audio file from a specified start time to a specified end time using ffmpeg.

    Args:
        input_file (str): The path to the input audio file.
        output_file (str): The path to the output audio file.
        start_time (str): The start time for the trim (format: HH:MM:SS).
        end_time (str): The end time for the trim (format: HH:MM:SS).
    """
    command = [
        "ffmpeg",
        "-i",
        input_file,
        "-ss",
        start_time,
        "-to",
        end_time,
        "-c",
        "copy",
        output_file,
    ]

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        console.print(
            f"Successfully trimmed audio to [cyan]{output_file}[/cyan]", style="green"
        )
    except FileNotFoundError:
        console.print("Error: ffmpeg is not installed.", style="bold red")
    except subprocess.CalledProcessError as e:
        console.print("Error during audio trimming:", style="bold red")
        console.print(e.stderr, style="red")


def main():
    """
    Parses command-line arguments and initiates the audio trimming process.
    """
    parser = argparse.ArgumentParser(
        description="A script to trim an audio file using ffmpeg."
    )
    parser.add_argument("input_file", help="The path to the input audio file.")
    parser.add_argument("output_file", help="The path to the output audio file.")
    parser.add_argument("start_time", help="The start time for the trim, in HH:MM:SS format.")
    parser.add_argument("end_time", help="The end time for the trim, in HH:MM:SS format.")

    args = parser.parse_args()

    trim_audio(args.input_file, args.output_file, args.start_time, args.end_time)


if __name__ == "__main__":
    main() 