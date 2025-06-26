// src/pages/CollageViewerPage.tsx - Complete implementation
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
import CollageScene from '../components/CollageScene';
import PhotoUploader from '../components/collage/PhotoUploader';
import RealtimeDebugPanel from '../components/debug/RealtimeDebugPanel';

// Debug function to log subscription state
const debugSubscription = () => {
  const store = useCollageStore.getState();
  console.log('🔍 VIEWER SUBSCRIPTION DEBUG:');
  console.log('- Current collage ID:', store.currentCollage?.id);
  console.log('- Realtime connected:', store.isRealtimeConnected);
  console.log('- Channel topic:', store.realtimeChannel?.topic);
  console.log('- Photos count:', store.photos?.length);
  
  // If no subscription, force one
  if (store.currentCollage?.id && !store.isRealtimeConnected) {
    console.log('⚠️ FORCING SUBSCRIPTION for collage:', store.currentCollage.id);
    store.setupRealtimeSubscription(store.currentCollage.id);
  }
};

// Debug flag for logging
const DEBUG = false;

const CollageViewerPage: React.FC = () => {  
  if (DEBUG) console.log('🖼️ VIEWER PAGE RENDER');
  
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
  
  // ADD DEBUG INFO
  console.log('🔍 VIEWER RENDER:', {
    collageId: currentCollage?.id,
    connected: isRealtimeConnected,
    photosCount: photos.length,
    renderTime: new Date().toISOString()
  });
  
  // SAFETY: Ensure photos is always an array
  const safePhotos = Array.isArray(photos) ? photos : [];
  
  // Add debugging for photo array changes
  useEffect(() => { 
    if (DEBUG) {
      console.log('🖼️ VIEWER: Photos array updated. Count:', safePhotos.length);
    }
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
  console.log('🔍 VIEWER: normalizedCode =', normalizedCode, 'currentCollage =', currentCollage?.id);

  // Load collage (which will set up real-time subscription)
  useEffect(() => {
    if (normalizedCode) {
      console.log('🖼️ VIEWER: Fetching collage with code:', normalizedCode);
      fetchCollageByCode(normalizedCode);
    }
    return () => { 
      console.log('🧹 VIEWER: Cleaning up realtime subscription');
      cleanupRealtimeSubscription();
    };
  }, [normalizedCode, fetchCollageByCode, cleanupRealtimeSubscription]);

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
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* 3D Scene - Full viewport */}
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 mb-4">Something went wrong with the 3D viewer</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Reload Page
              </button>
            </div>
          </div>
        }
      >
        <CollageScene photos={safePhotos} />
      </ErrorBoundary>

      {/* Controls Overlay */}
      {!isFullscreen && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Navigation */}
          <div className="absolute top-0 left-0 right-0 z-20 p-4">
            <div className="flex items-center justify-between">
              {/* Back Button */}
              <Link
                to="/dashboard"
                className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm text-white rounded-lg hover:bg-black/80 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Link>

              {/* Status and Actions */}
              <div className="flex items-center gap-3">
                {/* Connection Status */}
                <div className={`pointer-events-none px-3 py-2 rounded-lg text-sm font-medium ${
                  isRealtimeConnected 
                    ? 'bg-green-500/20 text-green-400 backdrop-blur-sm' 
                    : 'bg-red-500/20 text-red-400 backdrop-blur-sm'
                }`}>
                  {isRealtimeConnected ? '🟢 Live' : '🔴 Offline'}
                </div>

                {/* Upload Button */}
                <button
                  onClick={() => setShowUploader(true)}
                  className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Add Photos
                </button>

                {/* Share Button */}
                <button
                  onClick={() => handleCopy(window.location.href)}
                  className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share className="w-4 h-4" />
                      Share
                    </>
                  )}
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Maximize className="w-4 h-4" />
                  Fullscreen
                </button>
              </div>
            </div>
          </div>

          {/* Collage Info */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white max-w-sm">
              <h2 className="text-xl font-semibold mb-1">{currentCollage.name}</h2>
              <p className="text-gray-300 text-sm">Code: {currentCollage.code}</p>
              <p className="text-gray-300 text-sm">{safePhotos.length} photos</p>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Controls */}
      {isFullscreen && (
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Fullscreen Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 p-4">
            <div className="flex items-center justify-between">
              {/* Collage Info */}
              <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
                <div className="text-lg font-semibold">{currentCollage.name}</div>
                <div className="text-sm text-gray-300">{safePhotos.length} photos</div>
              </div>

              {/* Fullscreen Actions */}
              <div className="flex items-center gap-3">
                {/* Connection Status */}
                <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isRealtimeConnected 
                    ? 'bg-green-500/20 text-green-400 backdrop-blur-sm' 
                    : 'bg-red-500/20 text-red-400 backdrop-blur-sm'
                }`}>
                  {isRealtimeConnected ? '🟢 Live' : '🔴 Offline'}
                </div>

                {/* Upload Button */}
                <button
                  onClick={() => setShowUploader(true)}
                  className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Add Photos
                </button>

                {/* Share Button */}
                <button
                  onClick={() => handleCopy(window.location.href)}
                  className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Share'}</span>
                </button>

                {/* Exit Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="pointer-events-auto p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <Minimize className="w-5 h-5" />
                </button>
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
        <div className="fixed top-20 left-4 z-50 flex flex-col space-y-2">
          <button 
            onClick={debugSubscription}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Debug Subscription
          </button>
        </div>
      )}
      
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-20 w-64">
          <RealtimeDebugPanel 
            collageId={currentCollage?.id} 
          />
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