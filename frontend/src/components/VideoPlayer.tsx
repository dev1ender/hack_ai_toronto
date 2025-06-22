import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Project } from '@/types/project';
import { buildMediaUrlWithCacheBuster } from '@/lib/utils';
import { RefreshCw, Play, Pause, Volume2 } from 'lucide-react';

interface VideoPlayerProps {
  selectedProject?: Project;
}

export function VideoPlayer({ selectedProject }: VideoPlayerProps) {
  const [videoKey, setVideoKey] = useState<string>('');

  const [cacheBuster, setCacheBuster] = useState<number>(Date.now());
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Build full URLs using the utility function with cache busting
  const videoUrl = selectedProject?.videoUrl 
    ? buildMediaUrlWithCacheBuster(selectedProject.videoUrl, cacheBuster) 
    : undefined;
  const thumbnailUrl = selectedProject?.thumbnailUrl 
    ? buildMediaUrlWithCacheBuster(selectedProject.thumbnailUrl, cacheBuster) 
    : undefined;

  // Update video key and cache buster when project changes or is updated
  useEffect(() => {
    if (selectedProject) {
      const projectTimestamp = selectedProject.updatedAt ? new Date(selectedProject.updatedAt).getTime() : Date.now();
      const currentTimestamp = Date.now();
      const timestamp = Math.max(projectTimestamp, currentTimestamp);
      
      const newVideoKey = `${selectedProject.id}-${selectedProject.updatedAt}-${timestamp}`;
      setVideoKey(newVideoKey);
      setCacheBuster(timestamp);
      
      // Reset player state when project changes
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(true);
    }
  }, [selectedProject?.id, selectedProject?.updatedAt]);

  // Video event handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      setIsLoading(false);
      console.log('Video loaded - Duration:', video.duration);
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('Video failed to load:', {
      videoUrl,
      error: e.currentTarget.error,
      networkState: e.currentTarget.networkState,
      readyState: e.currentTarget.readyState
    });
    setIsLoading(false);
  };

  // Player control functions
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const newVolume = parseFloat(e.target.value);
    
    if (video) {
      video.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleManualRefresh = () => {
    const projectTimestamp = selectedProject?.updatedAt ? new Date(selectedProject.updatedAt).getTime() : Date.now();
    const currentTimestamp = Date.now();
    const timestamp = Math.max(projectTimestamp, currentTimestamp);
    
    setCacheBuster(timestamp);
    const newVideoKey = `${selectedProject?.id}-${selectedProject?.updatedAt}-${timestamp}`;
    setVideoKey(newVideoKey);
  };

  // Format time for display
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-4xl">
        <div className="relative">
          {/* Video Container */}
          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-black">
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  key={videoKey}
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  poster={thumbnailUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onCanPlay={handleCanPlay}
                  onEnded={handleVideoEnded}
                  onError={handleVideoError}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  preload="metadata"
                  crossOrigin="anonymous"
                >
                  Your browser does not support the video tag.
                </video>
                
                {/* Refresh Button */}
                <div className="absolute top-4 right-4 z-50">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleManualRefresh}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">
                  No video available
                  {selectedProject && (
                    <span className="block text-xs mt-2">
                      Project: {selectedProject.id}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Simple Controls */}
          {videoUrl && (
            <div className="bg-gray-900 text-white p-4 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause Button */}
                  <Button
                    onClick={togglePlayPause}
                    disabled={isLoading}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-gray-700 p-2"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </Button>

                  {/* Time Display */}
                  <div className="text-sm text-gray-300">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="text-sm text-gray-400">
                      Loading...
                    </div>
                  )}
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-gray-300" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Custom slider styling for volume */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 1px solid #ffffff;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 1px solid #ffffff;
        }
      `}</style>
    </div>
  );
}