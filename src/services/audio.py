import os
import numpy as np
import wave
import struct
from moviepy.editor import VideoFileClip, AudioFileClip, CompositeAudioClip, concatenate_audioclips
from moviepy.video.fx.speedx import speedx
from typing import List, Dict, Any, Optional
import logging
import subprocess
import tempfile

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
    
    def get_file_metadata(self, file_path: str) -> Dict[str, Any]:
        """Extract metadata from audio/video file"""
        try:
            # Try to process as video first
            try:
                clip = VideoFileClip(file_path)
                metadata = {
                    "duration": clip.duration,
                    "fps": clip.fps,
                    "has_audio": clip.audio is not None,
                    "file_type": "video"
                }
                
                if clip.audio:
                    metadata["sample_rate"] = clip.audio.fps
                    metadata["channels"] = clip.audio.nchannels
                else:
                    metadata["sample_rate"] = 44100
                    metadata["channels"] = 2
                
                clip.close()
                return metadata
                
            except Exception:
                # Try as audio file
                audio_clip = AudioFileClip(file_path)
                metadata = {
                    "duration": audio_clip.duration,
                    "sample_rate": audio_clip.fps,
                    "channels": audio_clip.nchannels,
                    "file_type": "audio"
                }
                audio_clip.close()
                return metadata
                
        except Exception as e:
            logger.error(f"Error extracting metadata from {file_path}: {e}")
            return {
                "duration": 0,
                "sample_rate": 44100,
                "channels": 2,
                "file_type": "unknown"
            }
    
    def generate_waveform(self, file_path: str, resolution: int = 1000) -> List[float]:
        """Generate waveform data for visualization"""
        try:
            # Load audio
            audio_clip = AudioFileClip(file_path)
            
            # Get audio data
            audio_data = audio_clip.to_soundarray()
            audio_clip.close()
            
            if len(audio_data.shape) > 1:
                # Convert to mono by averaging channels
                audio_data = np.mean(audio_data, axis=1)
            
            # Downsample for waveform visualization
            total_samples = len(audio_data)
            samples_per_point = max(1, total_samples // resolution)
            
            waveform = []
            for i in range(0, total_samples, samples_per_point):
                chunk = audio_data[i:i + samples_per_point]
                if len(chunk) > 0:
                    # Calculate RMS (root mean square) for this chunk
                    rms = np.sqrt(np.mean(chunk ** 2))
                    waveform.append(float(rms))
            
            # Normalize waveform
            if waveform:
                max_val = max(waveform)
                if max_val > 0:
                    waveform = [val / max_val for val in waveform]
            
            logger.info(f"Generated waveform with {len(waveform)} points")
            return waveform
            
        except Exception as e:
            logger.error(f"Error generating waveform for {file_path}: {e}")
            return [0.0] * resolution
    
    def replace_segment(
        self,
        original_path: str,
        replacement_path: str,
        start_time: float,
        end_time: float,
        output_path: str
    ):
        """Replace audio segment with new audio"""
        try:
            # Load original audio
            original_audio = AudioFileClip(original_path)
            replacement_audio = AudioFileClip(replacement_path)
            
            # Create segments
            before_segment = original_audio.subclip(0, start_time) if start_time > 0 else None
            after_segment = original_audio.subclip(end_time) if end_time < original_audio.duration else None
            
            # Combine segments
            segments = []
            if before_segment:
                segments.append(before_segment)
            segments.append(replacement_audio)
            if after_segment:
                segments.append(after_segment)
            
            # Create final audio using concatenation instead of composition
            final_audio = concatenate_audioclips(segments) if len(segments) > 1 else segments[0]
            
            # Write output
            final_audio.write_audiofile(output_path, codec='mp3', fps=original_audio.fps)
            
            # Clean up
            original_audio.close()
            replacement_audio.close()
            final_audio.close()
            if before_segment:
                before_segment.close()
            if after_segment:
                after_segment.close()
            
            logger.info(f"Audio segment replaced successfully: {output_path}")
            
        except Exception as e:
            logger.error(f"Error replacing audio segment: {e}")
            raise Exception(f"Audio segment replacement failed: {str(e)}")
    
    def replace_video_audio(self, video_path: str, audio_path: str, output_path: str):
        """Replace audio track in video file"""
        try:
            # Use existing video_audio_replacer functionality
            from services.video import replace_video_audio
            replace_video_audio(video_path, audio_path, output_path)
            logger.info(f"Video audio replaced successfully: {output_path}")
            
        except Exception as e:
            logger.error(f"Error replacing video audio: {e}")
            # Fallback to moviepy method
            try:
                video_clip = VideoFileClip(video_path)
                audio_clip = AudioFileClip(audio_path)
                
                # Set new audio
                final_video = video_clip.set_audio(audio_clip)
                
                # Write output
                final_video.write_videofile(output_path, codec='libx264', audio_codec='aac')
                
                # Clean up
                video_clip.close()
                audio_clip.close()
                final_video.close()
                
                logger.info(f"Video audio replaced successfully (fallback): {output_path}")
                
            except Exception as fallback_error:
                logger.error(f"Fallback method also failed: {fallback_error}")
                raise Exception(f"Video audio replacement failed: {str(e)}")
    
    def extract_audio_from_video(self, video_path: str, output_path: str):
        """Extract audio track from video file"""
        try:
            video_clip = VideoFileClip(video_path)
            
            if video_clip.audio is None:
                raise Exception("Video file has no audio track")
            
            audio_clip = video_clip.audio
            audio_clip.write_audiofile(output_path, codec='mp3')
            
            video_clip.close()
            audio_clip.close()
            
            logger.info(f"Audio extracted from video: {output_path}")
            
        except Exception as e:
            logger.error(f"Error extracting audio from video: {e}")
            raise Exception(f"Audio extraction failed: {str(e)}")
    
    def get_audio_duration(self, file_path: str) -> float:
        """Get duration of audio file"""
        try:
            audio_clip = AudioFileClip(file_path)
            duration = audio_clip.duration
            audio_clip.close()
            return duration
        except Exception as e:
            logger.error(f"Error getting audio duration: {e}")
            return 0.0
    
    def normalize_audio_levels(self, audio_paths: List[str], output_path: str):
        """Normalize audio levels across multiple files"""
        try:
            audio_clips = [AudioFileClip(path) for path in audio_paths]
            
            # Find the maximum RMS level
            max_rms = 0
            for clip in audio_clips:
                audio_data = clip.to_soundarray()
                if len(audio_data.shape) > 1:
                    audio_data = np.mean(audio_data, axis=1)
                rms = np.sqrt(np.mean(audio_data ** 2))
                max_rms = max(max_rms, rms)
            
            # Normalize all clips to the same RMS level
            normalized_clips = []
            for clip in audio_clips:
                audio_data = clip.to_soundarray()
                if len(audio_data.shape) > 1:
                    audio_data = np.mean(audio_data, axis=1)
                rms = np.sqrt(np.mean(audio_data ** 2))
                
                if rms > 0:
                    gain = max_rms / rms
                    normalized_clip = clip.fx.volumex(gain)
                else:
                    normalized_clip = clip
                
                normalized_clips.append(normalized_clip)
            
            # Combine normalized clips
            final_audio = CompositeAudioClip(normalized_clips)
            final_audio.write_audiofile(output_path, codec='mp3')
            
            # Clean up
            for clip in audio_clips + normalized_clips:
                clip.close()
            final_audio.close()
            
            logger.info(f"Audio levels normalized: {output_path}")
            
        except Exception as e:
            logger.error(f"Error normalizing audio levels: {e}")
            raise Exception(f"Audio normalization failed: {str(e)}")
    
    def validate_audio_file(self, file_path: str) -> bool:
        """Validate if file is a valid audio file"""
        try:
            audio_clip = AudioFileClip(file_path)
            duration = audio_clip.duration
            audio_clip.close()
            return duration > 0
        except Exception:
            return False
    
    def get_audio_info(self, file_path: str) -> Dict[str, Any]:
        """Get detailed audio information"""
        try:
            audio_clip = AudioFileClip(file_path)
            
            info = {
                "duration": audio_clip.duration,
                "sample_rate": audio_clip.fps,
                "channels": audio_clip.nchannels,
                "format": os.path.splitext(file_path)[1][1:].lower()
            }
            
            audio_clip.close()
            return info
            
        except Exception as e:
            logger.error(f"Error getting audio info: {e}")
            return {} 