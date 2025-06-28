import React from 'react';

interface VideoRecordingOverlayProps {
  recordingTime: number;
  remainingTime: number;
  logoUrl?: string;
}

const VideoRecordingOverlay: React.FC<VideoRecordingOverlayProps> = ({
  recordingTime,
  remainingTime,
  logoUrl = 'https://www.fusion-events.ca/wp-content/uploads/2025/06/Untitled-design-15.png'
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Recording indicator */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="text-white text-sm font-medium">REC</span>
      </div>
      
      {/* Timer */}
      <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
        <span className="text-white text-sm font-mono">{formatTime(remainingTime)}</span>
      </div>
      
      {/* Logo watermark */}
      <div className="absolute bottom-4 right-4 flex items-center justify-center">
        <img 
          src={logoUrl} 
          alt="Brand Logo" 
          className="h-8 w-auto opacity-90 drop-shadow-lg"
        />
      </div>
    </div>
  );
};

export default VideoRecordingOverlay;