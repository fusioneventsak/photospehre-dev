// src/pages/CollageViewerPage.tsx - FIXED: Enhanced real-time synchronization
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
  Settings,
  RefreshCw
} from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import { ErrorBoundary } from 'react-error-boundary';
import CollageScene from '../components/CollageScene';
import PhotoUploader from '../components/collage/PhotoUploader';
import RealtimeDebugPanel from '../components/debug/RealtimeDebugPanel';

// Debug flag for logging
const DEBUG = true; // Enable for debugging

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
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [lastPhotoCount, setLastPhotoCount] = useState(0);
  const navigate = useNavigate();

  // SAFETY: Ensure photos is always an array
  const safePhotos = Array.isArray(photos) ? photos : [];

  // Track photo count changes for debugging
  useEffect(() => {
    if (safePhotos.length !== lastPhotoCount) {
      console.log(`🖼️ VIEWER: Photo count changed: ${lastPhotoCount} -> ${safePhotos.length}`);
      setLastPhotoCount(safePhotos.length);
    }
  }, [safePhotos.length, lastPhotoCount]);

  // Normalize code to uppercase for consistent database lookup
  const normalizedCode = code?.toUpperCase();

  // Load collage and ensure real-time subscription
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

  // Ensure real-time subscription is active when collage is loaded
  useEffect(() => {
    if (currentCollage?.id && !isRealtimeConnected) {
      console.log('🔄 VIEWER: Collage loaded but not connected to realtime. Setting up subscription...');
      setupRealtimeSubscription(currentCollage.id);
    }
  }, [currentCollage?.id, isRealtimeConnected, setupRealtimeSubscription]);

  // Periodic check to ensure we're still connected
  useEffect(() => {
    if (!currentCollage?.id) return;

    const interval = setInterval(() => {
      if (!isRealtimeConnected) {
        console.log('🔄 VIEWER: Realtime disconnected. Attempting to reconnect...');
        setupRealtimeSubscription(currentCollage.id);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [currentCollage?.id, isRealtimeConnected, setupRealtimeSubscription]);

  // Manual refresh for debugging
  const handleManualRefresh = useCallback(async () => {
    if (currentCollage?.id) {
      console.log('🔄 VIEWER: Manual refresh triggered');
      try {
        await refreshPhotos(currentCollage.id);
        console.log('✅ VIEWER: Manual refresh completed');
      } catch (error) {
        console.error('❌ VIEWER: Manual refresh failed:', error);
      }
    }
  }, [currentCollage?.id, refreshPhotos]);

  // Force reconnection for debugging
  const handleForceReconnect = useCallback(() => {
    if (currentCollage?.id) {
      console.log('🔄 VIEWER: Force reconnecting to realtime...');
      cleanupRealtimeSubscription();
      setTimeout(() => {
        setupRealtimeSubscription(currentCollage.id);
      }, 1000);
    }
  }, [currentCollage?.id, cleanupRealtimeSubscription, setupRealtimeSubscription]);

  // Close modal when clicking outside
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowUploader(false);
    }
  };

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
      console.error('Copy error:', err);
    }
  };

  if (loading && !currentCollage) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-400">Loading collage...</p>
        </div>
      </div>
    );
  }

  if (error || !currentCollage) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Collage Not Found</h2>
          <p className="text-gray-400 mb-6">
            The collage you're looking for doesn't exist or the code might be incorrect.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Connection Status and Debug Info */}
      {DEBUG && (
        <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-2 rounded text-xs">
          <div>Collage: {currentCollage.name}</div>
          <div>Photos: {safePhotos.length}</div>
          <div>Connected: {isRealtimeConnected ? '✅' : '❌'}</div>
          <div className="flex gap-1 mt-1">
            <button 
              onClick={handleManualRefresh}
              className="px-2 py-1 bg-blue-600 rounded text-xs"
            >
              Refresh
            </button>
            <button 
              onClick={handleForceReconnect}
              className="px-2 py-1 bg-green-600 rounded text-xs"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className={`absolute top-4 right-4 z-40 flex items-center gap-3 transition-opacity duration-300 ${
        controlsVisible || !isFullscreen ? 'opacity-100' : 'opacity-0 hover:opacity-100'
      }`}>
        
        {/* Realtime Status */}
        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
          isRealtimeConnected 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {isRealtimeConnected ? '🟢 Live' : '🔴 Offline'}
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setShowUploader(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Add Photos
        </button>

        {/* Share Button */}
        <button
          onClick={() => handleCopy(window.location.href)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
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
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Back Button (only in non-fullscreen) */}
      {!isFullscreen && (
        <div className="absolute top-4 left-4 z-40">
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      )}

      {/* 3D Scene */}
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

      {/* Photo Uploader Modal */}
      {showUploader && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={handleModalBackdropClick}
        >
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Upload Photos</h3>
              <button
                onClick={() => setShowUploader(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {currentCollage && (
              <PhotoUploader 
                collageId={currentCollage.id}
                onUploadComplete={() => {
                  console.log('🖼️ VIEWER: Upload completed, photos should update via realtime');
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Collage Info Overlay */}
      {!isFullscreen && (
        <div className="absolute bottom-4 left-4 z-40 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white">
          <h2 className="text-xl font-semibold mb-1">{currentCollage.name}</h2>
          <p className="text-gray-300 text-sm">Code: {currentCollage.code}</p>
          <p className="text-gray-300 text-sm">{safePhotos.length} photos</p>
        </div>
      )}

      {/* Debug Panel */}
      {DEBUG && (
        <RealtimeDebugPanel />
      )}
    </div>
  );
};
// src/pages/CollageViewerPage.tsx - FIXED: Enhanced real-time synchronization
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
  Settings,
  RefreshCw
} from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import { ErrorBoundary } from 'react-error-boundary';
import CollageScene from '../components/CollageScene';
import PhotoUploader from '../components/collage/PhotoUploader';
import RealtimeDebugPanel from '../components/debug/RealtimeDebugPanel';

// Debug flag for logging
const DEBUG = true; // Enable for debugging

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
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [lastPhotoCount, setLastPhotoCount] = useState(0);
  const navigate = useNavigate();

  // SAFETY: Ensure photos is always an array
  const safePhotos = Array.isArray(photos) ? photos : [];

  // Track photo count changes for debugging
  useEffect(() => {
    if (safePhotos.length !== lastPhotoCount) {
      console.log(`🖼️ VIEWER: Photo count changed: ${lastPhotoCount} -> ${safePhotos.length}`);
      setLastPhotoCount(safePhotos.length);
    }
  }, [safePhotos.length, lastPhotoCount]);

  // Normalize code to uppercase for consistent database lookup
  const normalizedCode = code?.toUpperCase();

  // Load collage and ensure real-time subscription
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

  // Ensure real-time subscription is active when collage is loaded
  useEffect(() => {
    if (currentCollage?.id && !isRealtimeConnected) {
      console.log('🔄 VIEWER: Collage loaded but not connected to realtime. Setting up subscription...');
      setupRealtimeSubscription(currentCollage.id);
    }
  }, [currentCollage?.id, isRealtimeConnected, setupRealtimeSubscription]);

  // Periodic check to ensure we're still connected
  useEffect(() => {
    if (!currentCollage?.id) return;

    const interval = setInterval(() => {
      if (!isRealtimeConnected) {
        console.log('🔄 VIEWER: Realtime disconnected. Attempting to reconnect...');
        setupRealtimeSubscription(currentCollage.id);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [currentCollage?.id, isRealtimeConnected, setupRealtimeSubscription]);

  // Manual refresh for debugging
  const handleManualRefresh = useCallback(async () => {
    if (currentCollage?.id) {
      console.log('🔄 VIEWER: Manual refresh triggered');
      try {
        await refreshPhotos(currentCollage.id);
        console.log('✅ VIEWER: Manual refresh completed');
      } catch (error) {
        console.error('❌ VIEWER: Manual refresh failed:', error);
      }
    }
  }, [currentCollage?.id, refreshPhotos]);

  // Force reconnection for debugging
  const handleForceReconnect = useCallback(() => {
    if (currentCollage?.id) {
      console.log('🔄 VIEWER: Force reconnecting to realtime...');
      cleanupRealtimeSubscription();
      setTimeout(() => {
        setupRealtimeSubscription(currentCollage.id);
      }, 1000);
    }
  }, [currentCollage?.id, cleanupRealtimeSubscription, setupRealtimeSubscription]);

  // Close modal when clicking outside
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowUploader(false);
    }
  };

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
      console.error('Copy error:', err);
    }
  };

  if (loading && !currentCollage) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-400">Loading collage...</p>
        </div>
      </div>
    );
  }

  if (error || !currentCollage) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Collage Not Found</h2>
          <p className="text-gray-400 mb-6">
            The collage you're looking for doesn't exist or the code might be incorrect.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Connection Status and Debug Info */}
      {DEBUG && (
        <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-2 rounded text-xs">
          <div>Collage: {currentCollage.name}</div>
          <div>Photos: {safePhotos.length}</div>
          <div>Connected: {isRealtimeConnected ? '✅' : '❌'}</div>
          <div className="flex gap-1 mt-1">
            <button 
              onClick={handleManualRefresh}
              className="px-2 py-1 bg-blue-600 rounded text-xs"
            >
              Refresh
            </button>
            <button 
              onClick={handleForceReconnect}
              className="px-2 py-1 bg-green-600 rounded text-xs"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className={`absolute top-4 right-4 z-40 flex items-center gap-3 transition-opacity duration-300 ${
        controlsVisible || !isFullscreen ? 'opacity-100' : 'opacity-0 hover:opacity-100'
      }`}>
        
        {/* Realtime Status */}
        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
          isRealtimeConnected 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {isRealtimeConnected ? '🟢 Live' : '🔴 Offline'}
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setShowUploader(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Add Photos
        </button>

        {/* Share Button */}
        <button
          onClick={() => handleCopy(window.location.href)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
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
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Back Button (only in non-fullscreen) */}
      {!isFullscreen && (
        <div className="absolute top-4 left-4 z-40">
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      )}

      {/* 3D Scene */}
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

      {/* Photo Uploader Modal */}
      {showUploader && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={handleModalBackdropClick}
        >
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Upload Photos</h3>
              <button
                onClick={() => setShowUploader(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {currentCollage && (
              <PhotoUploader 
                collageId={currentCollage.id}
                onUploadComplete={() => {
                  console.log('🖼️ VIEWER: Upload completed, photos should update via realtime');
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Collage Info Overlay */}
      {!isFullscreen && (
        <div className="absolute bottom-4 left-4 z-40 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white">
          <h2 className="text-xl font-semibold mb-1">{currentCollage.name}</h2>
          <p className="text-gray-300 text-sm">Code: {currentCollage.code}</p>
          <p className="text-gray-300 text-sm">{safePhotos.length} photos</p>
        </div>
      )}

      {/* Debug Panel */}
      {DEBUG && (
        <RealtimeDebugPanel />
      )}
    </div>
  );
};

export default CollageViewerPage;