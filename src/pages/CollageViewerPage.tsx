// src/pages/CollageViewerPage.tsx - FIXED: Added real-time subscription
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Maximize, 
  Minimize, 
  Upload, 
  Share, 
  Copy, 
  Check, 
  X, 
  ChevronLeft,
  Camera,
  Settings
} from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import { ErrorBoundary } from 'react-error-boundary';
import CollageScene from '../components/three/CollageScene';
import PhotoUploader from '../components/collage/PhotoUploader';
import RealtimeDebugPanel from '../components/debug/RealtimeDebugPanel';

const CollageViewerPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { 
    currentCollage, 
    loading, 
    error, 
    photos,
    isRealtimeConnected,
    fetchCollageByCode,
    setupRealtimeSubscription,
    cleanupRealtimeSubscription,
    refreshPhotos
  } = useCollageStore();
  
  // SAFETY: Ensure photos is always an array
  const safePhotos = Array.isArray(photos) ? photos : [];
  
  // Add debugging for photo array changes
  useEffect(() => {
    console.log('🔍 VIEWER PAGE: safePhotos updated. Count:', safePhotos.length);
    console.log('🔍 VIEWER PAGE: safePhotos IDs:', safePhotos.map(p => p.id.slice(-6)).join(', '));
  }, [safePhotos]);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const navigate = useNavigate();

  // Close modal when clicking outside
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowUploader(false);
    }
  };

  // Normalize code to uppercase for consistent database lookup
  const normalizedCode = code?.toUpperCase();

  // FIXED: Load collage AND setup real-time subscription
  useEffect(() => {
    if (normalizedCode) {
      console.log('🔍 VIEWER: Fetching collage with code:', normalizedCode, 'and setting up subscription');
      fetchCollageByCode(normalizedCode);
    }
    
    return () => {
      console.log('🧹 VIEWER: Cleaning up realtime subscription');
      cleanupRealtimeSubscription();
    };
  }, [normalizedCode, fetchCollageByCode, cleanupRealtimeSubscription]);

  // FIXED: Setup real-time subscription when collage is loaded
  useEffect(() => {
    if (currentCollage?.id) {
      console.log('🔄 VIEWER: Ensuring realtime subscription for collage:', currentCollage.id);
      setupRealtimeSubscription(currentCollage.id);
    }
    
    return () => {
      cleanupRealtimeSubscription();
    };
  }, [currentCollage?.id, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  // Manual refresh for debugging
  const handleManualRefresh = useCallback(async () => {
    if (currentCollage?.id) {
      console.log('🔄 VIEWER: Manual refresh triggered');
      await refreshPhotos(currentCollage.id);
    }
  }, [currentCollage?.id, refreshPhotos]);

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        setTimeout(() => setControlsVisible(false), 3000);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        setControlsVisible(true);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Show/hide controls in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    let timeoutId: NodeJS.Timeout;

    const showControls = () => {
      setControlsVisible(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setControlsVisible(false), 3000);
    };

    const handleMouseMove = () => showControls();
    const handleKeyPress = () => showControls();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      clearTimeout(timeoutId);
    };
  }, [isFullscreen]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setControlsVisible(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <p className="text-white">Loading collage...</p>
        </div>
      </div>
    );
  }

  if (error || !currentCollage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">Collage Not Found</h2>
          <p className="text-gray-400 mb-6">
            The collage with code "{code}" doesn't exist or might have been removed.
          </p>
          <Link 
            to="/join" 
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Try Another Code
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/collage/${currentCollage.code}`;

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {/* 3D Scene */}
      <ErrorBoundary 
        FallbackComponent={({ error, resetErrorBoundary }) => (
          <div className="h-screen bg-black flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-xl mb-4">Scene Error</p>
              <p className="text-red-300 text-sm mb-4">{error?.message}</p>
              <button 
                onClick={resetErrorBoundary} 
                className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        resetKeys={[currentCollage.id, safePhotos.length]}
      >
        <CollageScene 
          photos={safePhotos}
          settings={currentCollage.settings}
          onSettingsChange={(newSettings) => {
            console.log('🎛️ Settings changed from viewer:', newSettings);
          }}
        />
      </ErrorBoundary>

      {/* Transparent Header - Only shown when controls are visible */}
      {controlsVisible && (
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="bg-black/40 backdrop-blur-sm border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Left side - Navigation & Title */}
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/join" 
                    className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Link>
                  <div>
                    <h1 className="text-lg font-semibold text-white">
                      {currentCollage.name}
                    </h1>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span>Code: {currentCollage.code}</span>
                      <span>•</span>
                      <span>{safePhotos.length} photos</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                        <span>{isRealtimeConnected ? 'Live' : 'Polling'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center space-x-2">
                  {/* Upload Photos Button */}
                  <button
                    onClick={() => setShowUploader(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Add Photos</span>
                  </button>

                  {/* Camera/Photobooth Button */}
                  <button
                    onClick={() => navigate(`/collage/${currentCollage.code}/photobooth`)}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleCopy(shareUrl)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Share className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Share'}</span>
                  </button>

                  {/* Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploader && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={handleModalBackdropClick}
        >
          <div 
            className="bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Upload Photos</h3>
              <button 
                onClick={() => setShowUploader(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content - Scrollable */}
            <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <div className="space-y-4">
                {/* Upload Instructions */}
                <div className="text-center text-gray-300 text-sm">
                  <p>Share your photos with the collage!</p>
                  <p className="text-gray-400 text-xs mt-1">Supported: JPG, PNG, GIF, WebP (max 10MB)</p>
                </div>
                
                {/* Photo Uploader Component */}
                <div className="min-h-[200px]">
                  <PhotoUploader 
                    collageId={currentCollage.id}
                    onUploadComplete={() => {
                      console.log('📸 VIEWER: Photo upload completed from modal');
                      if (!isRealtimeConnected) {
                        handleManualRefresh();
                      }
                      // Show success message and optionally close modal
                      setTimeout(() => {
                        // setShowUploader(false); // Uncomment to auto-close
                      }, 1500);
                    }}
                  />
                </div>
                
                {/* Additional Info */}
                <div className="text-center text-xs text-gray-500 border-t border-gray-700 pt-4">
                  <p>Photos will appear in the collage automatically</p>
                  <p>Code: <span className="font-mono text-gray-400">{currentCollage.code}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Debug Realtime Status - Only visible in development */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-20 w-64">
          <RealtimeDebugPanel collageId={currentCollage?.id} />
        </div>
      )}

      {/* Fullscreen hint */}
      {isFullscreen && controlsVisible && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-lg">
            Move mouse or press any key to show controls
          </div>
        </div>
      )}
    </div>
  );
};

export default CollageViewerPage;