// src/pages/PhotoboothPage.tsx - COMPLETE with Instagram Story-like text editing
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, SwitchCamera, Download, Send, X, RefreshCw, Type, ArrowLeft, Settings, Video, Palette, AlignCenter, AlignLeft, AlignRight, Move, ZoomIn, ZoomOut } from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import MobileVideoRecorder from '../components/video/MobileVideoRecorder';

type VideoDevice = {
  deviceId: string;
  label: string;
};

type CameraState = 'idle' | 'starting' | 'active' | 'error';

type TextStyle = {
  fontFamily: string;
  backgroundColor: string;
  backgroundOpacity: number;
  align: 'left' | 'center' | 'right';
  outline: boolean;
  padding: number;
};

const PhotoboothPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInitializingRef = useRef(false);
  
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [textSize, setTextSize] = useState(24);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textShadow, setTextShadow] = useState(true);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [recordingResolution, setRecordingResolution] = useState({ width: 1920, height: 1080 });
  
  // New Instagram Story-like states
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<Array<{
    id: string;
    text: string;
    position: { x: number; y: number };
    size: number;
    color: string;
    style: TextStyle;
    rotation: number;
    scale: number;
  }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [initialRotation, setInitialRotation] = useState(0);
  const [showTextStylePanel, setShowTextStylePanel] = useState(false);
  
  const [showError, setShowError] = useState(false);
  const { currentCollage, fetchCollageByCode, uploadPhoto, setupRealtimeSubscription, cleanupRealtimeSubscription, loading, error: storeError, photos } = useCollageStore();

  const textOverlayRef = useRef<HTMLDivElement>(null);
  const photoContainerRef = useRef<HTMLDivElement>(null);
  
  const safePhotos = Array.isArray(photos) ? photos : [];
  const normalizedCode = code?.toUpperCase();

  // Text style presets
  const textStylePresets = [
    { name: 'Classic', fontFamily: 'Arial', backgroundColor: 'transparent', backgroundOpacity: 0, align: 'center' as const, outline: true, padding: 0 },
    { name: 'Highlight', fontFamily: 'Arial', backgroundColor: '#000000', backgroundOpacity: 0.7, align: 'center' as const, outline: false, padding: 8 },
    { name: 'Neon', fontFamily: 'Impact', backgroundColor: 'transparent', backgroundOpacity: 0, align: 'center' as const, outline: true, padding: 0 },
    { name: 'Modern', fontFamily: 'Helvetica', backgroundColor: '#ffffff', backgroundOpacity: 0.9, align: 'center' as const, outline: false, padding: 12 },
  ];

  const colorPresets = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff'
  ];

  const cleanupCamera = useCallback(() => {
    console.log('🧹 Cleaning up camera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
    
    setCameraState('idle');
  }, []);

  const getVideoDevices = useCallback(async (): Promise<VideoDevice[]> => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId}`
        }));
      
      console.log('📹 Available video devices:', videoDevices);
      return videoDevices;
    } catch (error) {
      console.warn('⚠️ Could not enumerate devices:', error);
      return [];
    }
  }, []);

  const waitForVideoElement = useCallback(async (maxWaitMs: number = 5000): Promise<HTMLVideoElement | null> => {
    const startTime = Date.now();
    
    console.log('⏳ Waiting for video element to be available...');
    while (Date.now() - startTime < maxWaitMs) {
      if (videoRef.current) {
        console.log('✅ Video element is available');
        return videoRef.current;
      }
      
      console.log('⏳ Waiting for video element...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.error('❌ Video element not available after waiting');
    return null;
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    if (isInitializingRef.current) {
      console.log('🔄 Camera initialization already in progress, skipping...');
      return;
    }

    console.log('🎥 Starting camera initialization with device:', deviceId);
    isInitializingRef.current = true;
    setCameraState('starting');
    setError(null);

    try {
      cleanupCamera();
      const videoElement = await waitForVideoElement();
      if (!videoElement) {
        throw new Error('Video element not available - component may not be fully mounted');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isMobile = isIOS || isAndroid;
      
      console.log('📱 Platform detected:', { isIOS, isAndroid, isMobile });
      
      let constraints: MediaStreamConstraints;
      
      if (deviceId) {
        constraints = {
          video: {
            deviceId: { exact: deviceId },
            ...(isMobile ? { facingMode: "user" } : {}),
            ...(isIOS ? {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 }
            } : {})
          },
          audio: false
        };
      } else {
        constraints = {
          video: isMobile ? { facingMode: "user" } : true,
          audio: false
        };
      }
      
      console.log('🔧 Using constraints:', constraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Got media stream:', mediaStream.active);
      
      const videoDevices = await getVideoDevices();
      setDevices(videoDevices);
      
      if (!selectedDevice && videoDevices.length > 0 && isMobile) {
        const frontCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('front') ||
          device.label.toLowerCase().includes('user') ||
          device.label.toLowerCase().includes('selfie') ||
          device.label.toLowerCase().includes('facetime')
        );
        
        if (frontCamera) {
          console.log('📱 Auto-selecting front camera:', frontCamera.label);
          setSelectedDevice(frontCamera.deviceId);
        } else {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      }
      
      if (!videoRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        throw new Error('Video element became unavailable during setup');
      }
      
      videoRef.current.srcObject = mediaStream;
      
      const video = videoRef.current;
      
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
          mediaStream.getTracks().forEach(track => track.stop());
        });
      };
      
      const handleError = (event: Event) => {
        console.error('❌ Video element error:', event);
        setCameraState('error');
        setError('Video playback error');
        mediaStream.getTracks().forEach(track => track.stop());
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      video.addEventListener('error', handleError, { once: true });
      
      const timeoutId = setTimeout(() => {
        if (cameraState === 'starting' && video) {
          console.log('⏰ Camera start timeout, forcing play...');
          video.play().catch(err => {
            console.error('❌ Timeout play failed:', err);
            setCameraState('error');
            setError('Camera initialization timeout');
            mediaStream.getTracks().forEach(track => track.stop());
          });
        }
      }, 5000);
      
      const checkActive = setInterval(() => {
        if (cameraState === 'active') {
          clearTimeout(timeoutId);
          clearInterval(checkActive);
        }
      }, 100);
      
    } catch (err: any) {
      console.error('❌ Camera initialization failed:', err);
      setCameraState('error');
      
      let errorMessage = 'Failed to access camera. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera access denied. Please allow camera access and refresh the page.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please check your camera and try again.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is busy. Please close other apps using the camera and try again.';
      } else if (err.name === 'OverconstrainedError') {
        try {
          console.log('🔄 Trying fallback constraints...');
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: false 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
            streamRef.current = fallbackStream;
            setCameraState('active');
            setError(null);
            console.log('✅ Fallback camera working');
            return;
          } else {
            fallbackStream.getTracks().forEach(track => track.stop());
            throw new Error('Video element not available for fallback');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          errorMessage = 'Camera not compatible with this device.';
        }
      } else {
        errorMessage += err.message || 'Unknown camera error.';
      }
      
      setError(errorMessage);
    } finally {
      isInitializingRef.current = false;
    }
  }, [selectedDevice, cameraState, cleanupCamera, getVideoDevices, waitForVideoElement]);

  const switchCamera = useCallback(() => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    handleDeviceChange(devices[nextIndex].deviceId);
  }, [devices, selectedDevice]);

  const handleDeviceChange = useCallback((newDeviceId: string) => {
    if (newDeviceId === selectedDevice) return;
    
    setSelectedDevice(newDeviceId);
    
    if (!photo && cameraState !== 'starting') {
      console.log('📱 Device changed, restarting camera...');
      startCamera(newDeviceId);
    }
  }, [selectedDevice, photo, cameraState, startCamera]);

  // Add new text element
  const addTextElement = useCallback(() => {
    const newId = Date.now().toString();
    const newElement = {
      id: newId,
      text: '',
      position: { x: 50, y: 50 },
      size: 32,
      color: '#ffffff',
      style: textStylePresets[0],
      rotation: 0,
      scale: 1,
    };
    
    setTextElements(prev => [...prev, newElement]);
    setSelectedTextId(newId);
    setIsEditingText(true);
    // Don't auto-open style panel, let user choose
  }, []);

  // Delete text element
  const deleteTextElement = useCallback((id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
      setIsEditingText(false);
      setShowTextStylePanel(false);
    }
  }, [selectedTextId]);

  // Update text element
  const updateTextElement = useCallback((id: string, updates: Partial<typeof textElements[0]>) => {
    setTextElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  }, []);

  // Get touch distance for pinch gestures
  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Get touch angle for rotation
  const getTouchAngle = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX) * 180 / Math.PI;
  };

  // Handle text interaction start (mouse/touch)
  const handleTextInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent, textId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!photoContainerRef.current) return;
    
    setSelectedTextId(textId);
    setIsDragging(true);
    
    const container = photoContainerRef.current.getBoundingClientRect();
    
    if ('touches' in e && e.touches.length === 2) {
      setIsResizing(true);
      setInitialDistance(getTouchDistance(e.touches));
      setInitialRotation(getTouchAngle(e.touches));
      
      const element = textElements.find(el => el.id === textId);
      if (element) {
        setInitialScale(element.scale);
      }
    } else {
      setIsResizing(false);
    }
    
    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      if ('touches' in moveEvent && moveEvent.touches.length === 2 && isResizing) {
        const currentDistance = getTouchDistance(moveEvent.touches);
        const currentAngle = getTouchAngle(moveEvent.touches);
        
        const scaleChange = currentDistance / initialDistance;
        const rotationChange = currentAngle - initialRotation;
        
        updateTextElement(textId, {
          scale: Math.max(0.5, Math.min(3, initialScale * scaleChange)),
          rotation: rotationChange
        });
      } else {
        const clientX = 'touches' in moveEvent 
          ? moveEvent.touches[0].clientX 
          : moveEvent.clientX;
        const clientY = 'touches' in moveEvent 
          ? moveEvent.touches[0].clientY 
          : moveEvent.clientY;
        
        const x = Math.max(5, Math.min(95, ((clientX - container.left) / container.width) * 100));
        const y = Math.max(5, Math.min(95, ((clientY - container.top) / container.height) * 100));
        
        updateTextElement(textId, { position: { x, y } });
      }
    };
    
    const endHandler = () => {
      setIsDragging(false);
      setIsResizing(false);
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchend', endHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchend', endHandler);
  }, [textElements, isResizing, initialDistance, initialRotation, initialScale, updateTextElement]);

  // Handle resize corner drag (desktop only)
  const handleResizeCornerStart = useCallback((e: React.MouseEvent, textId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = textElements.find(el => el.id === textId);
    if (!element) return;
    
    setInitialScale(element.scale);
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const moveHandler = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const scaleChange = 1 + (delta / 100); // Adjust sensitivity
      
      updateTextElement(textId, {
        scale: Math.max(0.5, Math.min(3, initialScale * scaleChange))
      });
    };
    
    const endHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
  }, [textElements, initialScale, updateTextElement]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || cameraState !== 'active') return;

    setIsEditingText(false);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    const targetAspectRatio = 9 / 16;
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    
    let sourceWidth, sourceHeight, sourceX, sourceY;
    
    if (videoAspectRatio > targetAspectRatio) {
      sourceHeight = video.videoHeight;
      sourceWidth = sourceHeight * targetAspectRatio;
      sourceX = (video.videoWidth - sourceWidth) / 2;
      sourceY = 0;
    } else {
      sourceWidth = video.videoWidth;
      sourceHeight = sourceWidth / targetAspectRatio;
      sourceX = 0;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    const canvasWidth = 540;
    const canvasHeight = 960;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    context.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvasWidth, canvasHeight
    );

    // Render text elements on canvas
    textElements.forEach(element => {
      const x = (element.position.x / 100) * canvasWidth;
      const y = (element.position.y / 100) * canvasHeight;
      const fontSize = element.size * element.scale;
      
      context.save();
      context.translate(x, y);
      context.rotate((element.rotation * Math.PI) / 180);
      context.scale(element.scale, element.scale);
      
      context.font = `bold ${fontSize}px ${element.style.fontFamily}`;
      context.textAlign = element.style.align;
      context.textBaseline = 'middle';
      
      if (element.style.backgroundColor !== 'transparent') {
        context.fillStyle = `${element.style.backgroundColor}${Math.round(element.style.backgroundOpacity * 255).toString(16).padStart(2, '0')}`;
        const metrics = context.measureText(element.text);
        const padding = element.style.padding;
        context.fillRect(
          -metrics.width/2 - padding, 
          -fontSize/2 - padding, 
          metrics.width + padding*2, 
          fontSize + padding*2
        );
      }
      
      if (element.style.outline) {
        context.shadowColor = 'rgba(0,0,0,0.9)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 3;
        context.shadowOffsetY = 3;
        context.strokeStyle = 'black';
        context.lineWidth = fontSize * 0.08;
        context.strokeText(element.text, 0, 0);
      }
      
      context.fillStyle = element.color;
      context.fillText(element.text, 0, 0);
      
      context.restore();
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
    setPhoto(dataUrl);
    setTextPosition({ x: 50, y: 50 });
    setTextSize(24);
    cleanupCamera();
  }, [textElements, cameraState, cleanupCamera]);

  const uploadToCollage = useCallback(async () => {
    if (!photo || !currentCollage) return;

    setUploading(true);
    setError(null);
    setIsEditingText(false);
    
    try {
      const response = await fetch(photo);
      const blob = await response.blob();
      const file = new File([blob], 'photobooth.jpg', { type: 'image/jpeg' });

      const result = await uploadPhoto(currentCollage.id, file);
      if (result) {        
        setPhoto(null);
        setText('');
        setTextElements([]);
        setSelectedTextId(null);
        setShowTextStylePanel(false);
        
        setError('Photo uploaded successfully! Your photo will appear in the collage automatically.');
        setTimeout(() => setError(null), 3000);
        
        setTimeout(() => {
          console.log('🔄 Restarting camera after upload...');
          startCamera(selectedDevice);
        }, 500);
        
      } else {
        throw new Error('Failed to upload photo');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }, [photo, currentCollage, uploadPhoto, startCamera, selectedDevice]);

  const downloadPhoto = useCallback(() => {
    if (!photo) return;
    const link = document.createElement('a');
    link.href = photo;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = 'photobooth.jpg';
    link.click();
  }, [photo]);

  const retakePhoto = useCallback(() => {
    setPhoto(null);
    setText('');
    setTextElements([]);
    setSelectedTextId(null);
    setIsEditingText(false);
    setShowTextStylePanel(false);
    
    setTimeout(() => {
      console.log('🔄 Restarting camera after retake...');
      startCamera(selectedDevice);
    }, 100);
  }, [startCamera, selectedDevice]);

  const toggleTextEditing = useCallback(() => {
    setIsEditingText(prev => !prev);
    if (!isEditingText) setText(text || 'Edit this text');
  }, [isEditingText, text]);

  // Render text elements on photo
  const renderTextElements = () => {
    return textElements.map((element) => (
      <div
        key={element.id}
        className={`absolute cursor-move select-none ${selectedTextId === element.id ? 'ring-2 ring-white ring-opacity-70' : ''}`}
        style={{
          left: `${element.position.x}%`,
          top: `${element.position.y}%`,
          transform: `translate(-50%, -50%) scale(${element.scale}) rotate(${element.rotation}deg)`,
          touchAction: 'none',
          zIndex: selectedTextId === element.id ? 20 : 10,
        }}
        onMouseDown={(e) => {
          // Only handle drag if not editing - allow click to edit
          if (!isEditingText) {
            handleTextInteractionStart(e, element.id);
          }
        }}
        onTouchStart={(e) => {
          // Only handle drag if not editing - allow tap to edit
          if (!isEditingText) {
            handleTextInteractionStart(e, element.id);
          }
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Text clicked, setting selectedTextId to:', element.id);
          // Single click/tap to select and edit
          setSelectedTextId(element.id);
          // Close style panel when selecting different text
          if (selectedTextId !== element.id) {
            setShowTextStylePanel(false);
          }
          if (!isEditingText) {
            setIsEditingText(true);
          }
        }}
        onDoubleClick={() => {
          // Double click also works for editing
          setSelectedTextId(element.id);
          setIsEditingText(true);
        }}
      >
        {selectedTextId === element.id && isEditingText ? (
          <textarea
            value={element.text}
            onChange={(e) => updateTextElement(element.id, { text: e.target.value })}
            className="bg-transparent border-none outline-none text-center resize-none"
            style={{
              fontSize: `${element.size}px`,
              color: element.color,
              fontFamily: element.style.fontFamily,
              textAlign: element.style.align,
              backgroundColor: element.style.backgroundColor !== 'transparent' 
                ? `${element.style.backgroundColor}${Math.round(element.style.backgroundOpacity * 255).toString(16).padStart(2, '0')}`
                : 'transparent',
              padding: `${element.style.padding}px`,
              borderRadius: element.style.padding > 0 ? '8px' : '0',
              textShadow: element.style.outline ? '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' : 'none',
              caretColor: 'white',
              minWidth: '100px',
              maxWidth: '280px', // Constrain to viewport width
              width: 'auto',
              minHeight: '40px',
              maxHeight: '200px', // Prevent too tall text
              overflow: 'hidden',
              lineHeight: '1.2',
            }}
            autoFocus
            placeholder="Type something..."
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsEditingText(false);
              }
            }}
            onBlur={() => setIsEditingText(false)}
          />
        ) : (
          <div
            style={{
              fontSize: `${element.size}px`,
              color: element.color,
              fontFamily: element.style.fontFamily,
              textAlign: element.style.align,
              backgroundColor: element.style.backgroundColor !== 'transparent' 
                ? `${element.style.backgroundColor}${Math.round(element.style.backgroundOpacity * 255).toString(16).padStart(2, '0')}`
                : 'transparent',
              padding: `${element.style.padding}px`,
              borderRadius: element.style.padding > 0 ? '8px' : '0',
              textShadow: element.style.outline ? '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' : 'none',
              whiteSpace: 'pre-wrap', // Allow line breaks
              maxWidth: '280px', // Constrain to viewport width
              overflow: 'hidden',
              userSelect: 'none',
              lineHeight: '1.2',
              wordWrap: 'break-word',
              minHeight: element.text ? 'auto' : '40px', // Show minimum height when empty
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.style.align === 'left' ? 'flex-start' : element.style.align === 'right' ? 'flex-end' : 'center',
            }}
          >
            {element.text || (selectedTextId === element.id ? 'Type something...' : '')}
          </div>
        )}
        
        {/* Delete button for selected text */}
        {selectedTextId === element.id && !isEditingText && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTextElement(element.id);
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs z-30"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        
        {/* Resize corner for desktop */}
        {selectedTextId === element.id && !isEditingText && (
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border border-gray-400 rounded-full cursor-se-resize z-30 hidden md:block"
            onMouseDown={(e) => handleResizeCornerStart(e, element.id)}
            style={{ touchAction: 'none' }}
          />
        )}
      </div>
    ));
  };
  
  useEffect(() => {
    if (normalizedCode) {
      console.log('🔍 Fetching collage with normalized code:', normalizedCode);
      setShowError(false);
      fetchCollageByCode(normalizedCode);
    }
  }, [normalizedCode, fetchCollageByCode]);

  useEffect(() => {
    if (storeError && !loading && !currentCollage) {
      const timer = setTimeout(() => {
        setShowError(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [storeError, loading, currentCollage]);

  useEffect(() => {
    if (currentCollage?.id) {
      console.log('🔄 Setting up realtime subscription in photobooth for collage:', currentCollage.id);
      setupRealtimeSubscription(currentCollage.id);
    }
    
    return () => {
      cleanupRealtimeSubscription();
    };
  }, [currentCollage?.id, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  useEffect(() => {
    if (currentCollage && !photo && cameraState === 'idle' && !isInitializingRef.current) {
      console.log('🚀 Initializing camera...');
      const timer = setTimeout(() => {
        startCamera(selectedDevice);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [photo, cameraState, startCamera, selectedDevice, currentCollage]);

  useEffect(() => {
    if (cameraState === 'error' && currentCollage) {
      console.log('🔄 Setting up auto-retry for camera error...');
      const retryTimer = setTimeout(() => {
        console.log('🔄 Auto-retrying camera initialization...');
        startCamera(selectedDevice);
      }, 3000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [cameraState, startCamera, selectedDevice, currentCollage]);

  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up...');
      cleanupCamera();
    };
  }, [cleanupCamera]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 Page visible, resuming camera...');
        if (!photo && cameraState === 'idle') {
          setTimeout(() => startCamera(selectedDevice), 500);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [photo, cameraState, startCamera, selectedDevice]);

  if (loading || (!currentCollage && !storeError)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p className="text-white">Loading photobooth...</p>
            <p className="text-gray-400 text-sm mt-2">
              Looking for collage: {normalizedCode}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showError && storeError && !loading && !currentCollage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Collage Not Found</h2>
              <p className="text-red-200 mb-4">
                {storeError || `No collage found with code "${normalizedCode}"`}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/join')}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Try Another Code
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCollage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p className="text-white">Loading photobooth...</p>
            <p className="text-gray-400 text-sm mt-2">
              Looking for collage: {normalizedCode}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white" style={{ paddingBottom: showTextStylePanel ? '300px' : '0' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/collage/${currentCollage?.code || ''}`)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Camera className="w-6 h-6 text-purple-500" />
                <span>Photobooth</span>
              </h1>
              <p className="text-gray-400">{currentCollage?.name} • Code: {currentCollage?.code}</p>
            </div>
          </div>
          
          {!photo && devices.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="Switch Camera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          )}
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-lg ${
            error.includes('successfully') 
              ? 'bg-green-900/30 border border-green-500/50 text-green-200'
              : 'bg-red-900/30 border border-red-500/50 text-red-200'
          }`}>
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          <div className="flex-1 flex justify-center">
            <div className="bg-gray-900 rounded-lg overflow-hidden w-full max-w-xs sm:max-w-sm lg:max-w-md">
              {photo ? (
                <div ref={photoContainerRef} className="relative aspect-[9/16]">
                  <img 
                    src={photo} 
                    alt="Captured photo" 
                    className="w-full h-full object-cover"
                  />
                  
                  {renderTextElements()}
                  
                  {/* Instagram Story-like UI Controls - Top Right */}
                  <div className="absolute top-4 right-4 flex flex-col space-y-3 z-20">
                    <button
                      onClick={addTextElement}
                      className="w-12 h-12 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white rounded-full flex items-center justify-center border border-white/20 transition-all"
                      title="Add Text"
                    >
                      <Type className="w-6 h-6" />
                    </button>
                    
                    <button
                      onClick={downloadPhoto}
                      className="w-12 h-12 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white rounded-full flex items-center justify-center border border-white/20 transition-all"
                      title="Download"
                    >
                      <Download className="w-6 h-6" />
                    </button>
                    
                    {selectedTextId && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Palette clicked, selectedTextId:', selectedTextId, 'showTextStylePanel:', showTextStylePanel);
                          // Force state update with callback
                          setShowTextStylePanel(prev => {
                            console.log('Setting showTextStylePanel from', prev, 'to true');
                            return true;
                          });
                        }}
                        className={`w-12 h-12 backdrop-blur-sm text-white rounded-full flex items-center justify-center border border-white/20 transition-all ${
                          showTextStylePanel ? 'bg-white/80 text-black' : 'bg-black/60 hover:bg-black/80'
                        }`}
                        title="Text Style"
                      >
                        <Palette className="w-6 h-6" />
                      </button>
                    )}
                    
                    {/* Delete All Text Button */}
                    {textElements.length > 0 && (
                      <button
                        onClick={() => {
                          setTextElements([]);
                          setSelectedTextId(null);
                          setIsEditingText(false);
                          setShowTextStylePanel(false);
                        }}
                        className="w-12 h-12 bg-red-600/60 backdrop-blur-sm hover:bg-red-600/80 text-white rounded-full flex items-center justify-center border border-white/20 transition-all"
                        title="Delete All Text"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                  

                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={retakePhoto}
                        className="px-4 py-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white rounded-full transition-all border border-white/20"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={uploadToCollage}
                        disabled={uploading}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-full transition-colors border border-white/20"
                      >
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[9/16] bg-gray-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    className="w-full h-full object-cover"
                  />
                  
                  {cameraState !== 'active' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center text-white">
                        {cameraState === 'starting' && (
                          <>
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2"></div>
                            <p className="text-sm">Starting camera...</p>
                          </>
                        )}
                        {cameraState === 'error' && (
                          <>
                            <Camera className="w-8 h-8 mx-auto mb-2 text-red-400" />
                            <p className="text-red-200 text-sm mb-2">Camera unavailable</p>
                            <button
                              onClick={() => startCamera(selectedDevice)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                            >
                              Retry
                            </button>
                          </>
                        )}
                        {cameraState === 'idle' && (
                          <>
                            <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm mb-2">Camera not started</p>
                            <button
                              onClick={() => {
                                console.log('🎥 Manual camera start requested');
                                startCamera(selectedDevice);
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                            >
                              Start Camera
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {text.trim() && cameraState === 'active' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
                      <div 
                        className="text-white font-bold text-center px-4 py-3 bg-black/60 backdrop-blur-sm rounded-xl max-w-[90%] border border-white/20"
                        style={{ 
                          fontSize: `${Math.max(1.5, 4 - (text.length / 20))}rem`,
                          textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)',
                          lineHeight: '1.2'
                        }}
                      >
                        {text}
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute bottom-28 sm:bottom-24 lg:bottom-20 left-2 right-2 px-2">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="ADD TEXT BEFORE TAKING PICTURE:"
                      className="w-full h-10 sm:h-12 bg-black/70 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-white placeholder-gray-300 resize-none focus:outline-none focus:border-purple-400 focus:bg-black/80 transition-all"
                      style={{ fontSize: '16px' }}
                      maxLength={100}
                    />
                    <div className="flex justify-between items-center mt-1 px-1">
                      <span className="text-xs text-gray-300">
                        {text.length}/100
                      </span>
                      {text && (
                        <button
                          onClick={() => setText('')}
                          className="text-xs text-red-300 hover:text-red-200 transition-colors px-2 py-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {cameraState === 'active' && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <button 
                        onClick={capturePhoto}
                        className="w-20 h-20 sm:w-16 sm:h-16 lg:w-14 lg:h-14 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 transition-all active:scale-95 flex items-center justify-center shadow-lg focus:outline-none"
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                      >
                        <div className="w-14 h-14 sm:w-10 sm:h-10 lg:w-8 lg:h-8 bg-gray-300 rounded-full"></div>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          <div className="w-full lg:w-72 space-y-4 lg:space-y-6">
            {/* TEXT STYLING PANEL - INLINE APPROACH */}
            {showTextStylePanel && selectedTextId && (
              <div className="bg-red-500 p-6 rounded-lg">
                <h3 className="text-white text-lg font-bold mb-4">🎨 Text Styling Panel</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">Size</label>
                    <input
                      type="range"
                      min="16"
                      max="72"
                      value={textElements.find(el => el.id === selectedTextId)?.size || 32}
                      onChange={(e) => updateTextElement(selectedTextId, { size: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-white text-sm">
                      {textElements.find(el => el.id === selectedTextId)?.size || 32}px
                    </span>
                  </div>
                  
                  <div>
                    <label className="text-white text-sm font-medium mb-2 block">Color</label>
                    <div className="grid grid-cols-5 gap-2">
                      {colorPresets.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateTextElement(selectedTextId, { color })}
                          className="w-8 h-8 rounded-full border-2 border-white"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowTextStylePanel(false)}
                    className="w-full py-2 bg-white text-black rounded-lg font-semibold"
                  >
                    Close Panel
                  </button>
                </div>
              </div>
            )}

            {/* DEBUG: Show panel state in sidebar */}
            <div className="bg-yellow-500 p-4 rounded-lg">
              <h3 className="text-black font-bold">DEBUG INFO</h3>
              <p className="text-black">Selected ID: {selectedTextId || 'NONE'}</p>
              <p className="text-black">Show Panel: {showTextStylePanel ? 'TRUE' : 'FALSE'}</p>
              <p className="text-black">Should Render: {(showTextStylePanel && selectedTextId) ? 'YES' : 'NO'}</p>
              <p className="text-black">Text Elements: {textElements.length}</p>
            </div>
            {devices.length > 1 && (
              <div className="bg-gray-900 rounded-lg p-4 lg:p-6">
                <div className="flex items-center space-x-2 mb-3 lg:mb-4">
                  <Settings className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" />
                  <h3 className="text-base lg:text-lg font-semibold text-white">Camera Settings</h3>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Camera Device
                    {devices.length > 0 && (
                      <span className="text-xs text-gray-400 ml-2">
                        ({devices.length} available)
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    style={{ fontSize: '16px' }}
                  >
                    {devices.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="bg-gray-900 rounded-lg p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Text Editing</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• Tap the <Type className="w-4 h-4 inline mx-1" /> icon to add text</p>
                <p>• Tap on text to edit content</p>
                <p>• Drag text to move it around</p>
                <p>• Use two fingers to resize and rotate (mobile)</p>
                <p>• Drag corner handle to resize (desktop)</p>
                <p>• Tap <Palette className="w-4 h-4 inline mx-1" /> to change style and color</p>
                <p>• Tap individual X to delete specific text</p>
                <p>• Tap red X icon to delete all text</p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">How to use</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>1. Allow camera access when prompted</p>
                <p>2. If camera doesn't start, tap "Start Camera"</p>
                <p>3. Add text before or after taking a photo</p>
                <p>4. Tap the large white button to take a photo</p>
                <p>5. Edit text position and size if needed</p>
                <p>6. Review and upload to the collage</p>
              </div>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-semibold text-purple-300 mb-3">Tips</h3>
              <div className="space-y-2 text-sm text-purple-200">
                <p>• Hold your device steady for clearer photos</p>
                <p>• If camera doesn't start, try refreshing the page</p>
                <p>• You can add multiple text elements</p>
                <p>• Drag text to position it anywhere on the photo</p>
                <p>• Use the controls to resize and style your text</p>
                <p>• Photos appear in the collage automatically</p>
              </div>
            </div>

            {currentCollage && (
              <div className="bg-gray-900 rounded-lg p-4 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-white mb-3">Collage Info</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="text-white truncate ml-2">{currentCollage.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Code:</span>
                    <span className="text-white font-mono">{currentCollage.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Photos:</span>
                    <span className="text-white">{safePhotos.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showVideoRecorder && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/50 backdrop-blur-md p-4 rounded-lg border border-white/20">
          <MobileVideoRecorder 
            canvasRef={canvasRef} 
            onClose={() => setShowVideoRecorder(false)}
            onResolutionChange={(width, height) => setRecordingResolution({ width, height })}
          />
        </div>
      )}
    </div>
  );
};

export default PhotoboothPage;