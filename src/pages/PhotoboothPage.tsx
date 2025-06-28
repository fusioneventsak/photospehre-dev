// src/pages/PhotoboothPage.tsx - FIXED: Mobile zoom prevention & larger capture button
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, SwitchCamera, Download, Send, X, RefreshCw, Type, ArrowLeft, Settings, Video } from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import MobileVideoRecorder from '../components/video/MobileVideoRecorder';

type VideoDevice = {
  deviceId: string;
  label: string;
};

type CameraState = 'idle' | 'starting' | 'active' | 'error';

const PhotoboothPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInitializingRef = useRef(false);
  
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [recordingResolution, setRecordingResolution] = useState({ width: 1920, height: 1080 });
  const [showError, setShowError] = useState(false);
  const { currentCollage, fetchCollageByCode, uploadPhoto, setupRealtimeSubscription, cleanupRealtimeSubscription, loading, error: storeError, photos } = useCollageStore();

  const error = storeError;
  
  // FIXED: Normalize code to uppercase for consistent database lookup
  const normalizedCode = code?.toUpperCase();

  const cleanupCamera = useCallback(() => {
    console.log('🧹 Cleaning up camera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`🛑 Stopping track: ${track.kind} (${track.label})`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraState('idle');
    console.log('✅ Camera cleanup complete');
  }, []);

  // FIXED: Wait for video element to be available
  const waitForVideoElement = useCallback(async (maxWaitMs: number = 5000): Promise<HTMLVideoElement | null> => {
    const startTime = Date.now();
    
    console.log('⏳ Waiting for video element to be available...');
    while (Date.now() - startTime < maxWaitMs) {
      if (videoRef.current) {
        console.log('✅ Video element is available');
        return videoRef.current;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.error('❌ Video element not available after waiting');
    return null;
  }, []);

  const getVideoDevices = useCallback(async (): Promise<VideoDevice[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`
        }));
      
      console.log('📹 Available video devices:', videoDevices);
      return videoDevices;
    } catch (err) {
      console.error('❌ Failed to get video devices:', err);
      return [];
    }
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      console.log('🔄 Camera initialization already in progress, skipping...');
      return;
    }

    isInitializingRef.current = true;
    
    try {
      console.log('🎥 Starting camera...', { deviceId, currentState: cameraState });
      
      // Clean up any existing stream first
      cleanupCamera();
      setCameraState('starting');
      
      // Wait for video element to be available
      const videoElement = await waitForVideoElement();
      if (!videoElement) {
        throw new Error('Video element not available');
      }
      
      // Get available devices if we don't have them
      let availableDevices = devices;
      if (availableDevices.length === 0) {
        availableDevices = await getVideoDevices();
        setDevices(availableDevices);
      }
      
      // Determine which device to use
      let targetDeviceId = deviceId || selectedDevice;
      if (!targetDeviceId && availableDevices.length > 0) {
        // Try to find back camera first, fallback to first available
        const backCamera = availableDevices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        targetDeviceId = backCamera?.deviceId || availableDevices[0].deviceId;
        setSelectedDevice(targetDeviceId);
      }
      
      console.log('📱 Using device:', targetDeviceId);
      
      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: targetDeviceId ? { exact: targetDeviceId } : undefined,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          facingMode: targetDeviceId ? undefined : { ideal: 'environment' }
        },
        audio: false
      };
      
      console.log('🎯 Requesting media with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Media stream obtained:', mediaStream.getTracks().map(t => `${t.kind}: ${t.label}`));
      
      // Double-check video element is still available
      if (!videoRef.current) {
        // Clean up stream if video element disappeared
        mediaStream.getTracks().forEach(track => track.stop());
        throw new Error('Video element became unavailable during setup');
      }
      
      const video = videoRef.current;
      video.srcObject = mediaStream;
      
      const handleLoadedMetadata = () => {
        console.log('📹 Video metadata loaded, playing...');
        if (!video) return;
        
        video.play().then(() => {
          streamRef.current = mediaStream;
          setCameraState('active');
          console.log('✅ Camera active and streaming');
        }).catch(playErr => {
          console.error('❌ Failed to play video:', playErr);
          setCameraState('error');
          setError('Failed to start video playback');
          // Clean up stream on play error
          mediaStream.getTracks().forEach(track => track.stop());
        });
      };
      
      const handleError = (err: Event) => {
        console.error('❌ Video element error:', err);
        setCameraState('error');
        setError('Video playback error');
        // Clean up stream on video error
        mediaStream.getTracks().forEach(track => track.stop());
      };
      
      // Set up event listeners
      video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      video.addEventListener('error', handleError, { once: true });
      
      // Fallback timeout
      setTimeout(() => {
        if (cameraState === 'starting') {
          console.warn('⚠️ Camera start timeout, forcing error state');
          setCameraState('error');
          setError('Camera initialization timeout');
          mediaStream.getTracks().forEach(track => track.stop());
        }
      }, 10000);
      
    } catch (err: any) {
      console.error('❌ Failed to start camera:', err);
      setCameraState('error');
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera constraints not supported. Trying with default settings...');
        // Retry with basic constraints
        setTimeout(() => startCamera(), 1000);
      } else {
        setError(`Camera error: ${err.message}`);
      }
    } finally {
      isInitializingRef.current = false;
    }
  }, [selectedDevice, cameraState, cleanupCamera, getVideoDevices, waitForVideoElement]);

  const switchCamera = useCallback(async () => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    console.log('🔄 Switching camera to:', nextDevice.label);
    setSelectedDevice(nextDevice.deviceId);
    await startCamera(nextDevice.deviceId);
  }, [devices, selectedDevice, startCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || cameraState !== 'active') {
      console.error('❌ Cannot capture: missing refs or camera not active');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('❌ Cannot get canvas context');
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedPhoto(url);
        console.log('📸 Photo captured successfully');
      }
    }, 'image/jpeg', 0.9);
  }, [cameraState]);

  const retakePhoto = useCallback(() => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto);
      setCapturedPhoto(null);
    }
  }, [capturedPhoto]);

  const handleUpload = useCallback(async () => {
    if (!capturedPhoto || !normalizedCode) return;

    setIsUploading(true);
    try {
      // Convert data URL to blob
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      
      // Create file from blob
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      await uploadPhoto(normalizedCode, file);
      
      // Clean up and navigate
      URL.revokeObjectURL(capturedPhoto);
      setCapturedPhoto(null);
      
      // Navigate back to collage view
      navigate(`/collage/${normalizedCode}`);
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [capturedPhoto, normalizedCode, uploadPhoto, navigate]);

  // Initialize camera and devices on mount
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        console.log('🚀 Initializing camera system...');
        
        // Get available devices
        const videoDevices = await getVideoDevices();
        setDevices(videoDevices);
        
        if (videoDevices.length > 0) {
          // Start camera with first available device
          const preferredDevice = videoDevices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          ) || videoDevices[0];
          
          setSelectedDevice(preferredDevice.deviceId);
          await startCamera(preferredDevice.deviceId);
        } else {
          setCameraState('error');
          setError('No cameras found on this device');
        }
      } catch (err) {
        console.error('❌ Failed to initialize camera:', err);
        setCameraState('error');
        setError('Failed to initialize camera system');
      }
    };

    initializeCamera();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Component unmounting, cleaning up...');
      cleanupCamera();
    };
  }, [getVideoDevices, startCamera, cleanupCamera]);

  // Fetch collage data
  useEffect(() => {
    if (normalizedCode) {
      fetchCollageByCode(normalizedCode);
      setupRealtimeSubscription(normalizedCode);
    }

    return () => {
      cleanupRealtimeSubscription();
    };
  }, [normalizedCode, fetchCollageByCode, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!currentCollage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Collage not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <button
          onClick={() => navigate(`/collage/${normalizedCode}`)}
          className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Collage</span>
        </button>
        
        <h1 className="text-xl font-bold text-white text-center flex-1">
          {currentCollage.title} - Photo Booth
        </h1>
        
        <button
          onClick={() => setShowVideoRecorder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          <Video size={20} />
          <span className="hidden sm:inline">Record Video</span>
        </button>
      </div>

      {/* Error Display */}
      {showError && error && (
        <div className="mx-4 mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setShowError(false)}
              className="text-red-300 hover:text-red-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {capturedPhoto ? (
          /* Photo Preview */
          <div className="w-full max-w-2xl bg-black/20 backdrop-blur-sm rounded-2xl p-6">
            <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={retakePhoto}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded-xl transition-colors"
              >
                <RefreshCw size={20} />
                Retake
              </button>
              
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-xl transition-colors"
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Add to Collage
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Camera View */
          <div className="w-full max-w-2xl bg-black/20 backdrop-blur-sm rounded-2xl p-6">
            {/* Camera Status */}
            <div className="mb-4 text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                cameraState === 'active' ? 'bg-green-500/20 text-green-300' :
                cameraState === 'starting' ? 'bg-yellow-500/20 text-yellow-300' :
                cameraState === 'error' ? 'bg-red-500/20 text-red-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  cameraState === 'active' ? 'bg-green-400' :
                  cameraState === 'starting' ? 'bg-yellow-400 animate-pulse' :
                  cameraState === 'error' ? 'bg-red-400' :
                  'bg-gray-400'
                }`} />
                {cameraState === 'active' ? 'Camera Ready' :
                 cameraState === 'starting' ? 'Starting Camera...' :
                 cameraState === 'error' ? 'Camera Error' :
                 'Camera Idle'}
              </div>
            </div>

            {/* Video Element */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {cameraState === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-lg">Starting camera...</div>
                </div>
              )}
              
              {cameraState === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    <Camera size={48} className="mx-auto mb-4 opacity-50" />
                    <div className="text-lg mb-2">Camera Error</div>
                    <button
                      onClick={() => startCamera()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {/* Switch Camera */}
              {devices.length > 1 && (
                <button
                  onClick={switchCamera}
                  disabled={cameraState !== 'active'}
                  className="p-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded-full transition-colors"
                >
                  <SwitchCamera size={24} />
                </button>
              )}

              {/* Capture Button - FIXED: Made larger for mobile */}
              <button
                onClick={capturePhoto}
                disabled={cameraState !== 'active'}
                className="w-20 h-20 bg-white hover:bg-gray-100 disabled:bg-gray-300 text-gray-800 rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <Camera size={32} />
              </button>

              {/* Settings placeholder */}
              <button
                disabled
                className="p-3 bg-gray-600/50 text-gray-400 rounded-full cursor-not-allowed"
              >
                <Settings size={24} />
              </button>
            </div>

            {/* Device Info */}
            {selectedDevice && devices.length > 0 && (
              <div className="mt-4 text-center text-sm text-gray-300">
                Using: {devices.find(d => d.deviceId === selectedDevice)?.label || 'Unknown Camera'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Recorder Modal */}
      {showVideoRecorder && (
        <MobileVideoRecorder
          collageCode={normalizedCode!}
          onClose={() => setShowVideoRecorder(false)}
          resolution={recordingResolution}
        />
      )}
    </div>
  );
};

export default PhotoboothPage;