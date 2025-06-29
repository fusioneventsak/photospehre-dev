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
  const { currentCollage, fetchCollageByCode, loading, error: collageError, uploadPhoto } = useCollageStore();
  
  // Camera state
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  
  // Text editing state
  const [textElements, setTextElements] = useState<Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    style: TextStyle;
    fontSize: number;
    color: string;
    rotation: number;
    scale: number;
  }>>([]);
  const [isEditingText, setIsEditingText] = useState(false);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [showTextStylePanel, setShowTextStylePanel] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#000000',
    backgroundOpacity: 0.5,
    align: 'center',
    outline: true,
    padding: 10
  });
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(24);
  const [textRotation, setTextRotation] = useState(0);
  const [textScale, setTextScale] = useState(1);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  
  // Load collage data
  useEffect(() => {
    if (code) {
      const normalizedCode = code.toUpperCase();
      fetchCollageByCode(normalizedCode);
    }
  }, [code, fetchCollageByCode]);
  
  // Initialize camera
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`
          }));
        
        setDevices(videoDevices);
        
        if (videoDevices.length > 0 && !currentDeviceId) {
          // Prefer front camera on mobile if available
          const frontCamera = videoDevices.find(d => 
            d.label.toLowerCase().includes('front') || 
            d.label.toLowerCase().includes('user') ||
            d.label.toLowerCase().includes('selfie')
          );
          
          setCurrentDeviceId(frontCamera?.deviceId || videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error getting devices:', err);
        setError('Could not access camera devices');
      }
    };
    
    getDevices();
  }, [currentDeviceId]);
  
  // Start camera when device is selected
  useEffect(() => {
    const startCamera = async () => {
      if (!currentDeviceId || cameraState === 'starting' || cameraState === 'active') return;
      
      setCameraState('starting');
      setError(null);
      
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraState('active');
        }
      } catch (err: any) {
        console.error('Error starting camera:', err);
        setCameraState('error');
        setError(err.message || 'Could not start camera');
      }
    };
    
    startCamera();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentDeviceId, cameraState]);
  
  // Switch camera
  const switchCamera = useCallback(() => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    
    setCameraState('idle');
    setCurrentDeviceId(devices[nextIndex].deviceId);
  }, [devices, currentDeviceId]);
  
  // Take photo
  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current && cameraState === 'active') {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video aspect ratio
      const videoAspectRatio = video.videoWidth / video.videoHeight;
      
      // Use a standard size for better quality
      const canvasWidth = 1280;
      const canvasHeight = Math.round(canvasWidth / videoAspectRatio);
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPhoto(dataUrl);
      
      // Stop camera to save battery
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setCameraState('idle');
    }
  }, [cameraState]);
  
  // Retake photo
  const retakePhoto = useCallback(() => {
    setPhoto(null);
    setTextElements([]);
    setIsEditingText(false);
    setActiveTextId(null);
    setShowTextStylePanel(false);
    setCameraState('idle');
  }, []);
  
  // Download photo
  const downloadPhoto = useCallback(() => {
    if (!photo) return;
    
    const renderAndDownload = async () => {
      try {
        let finalPhoto = photo;
        
        // Render text if there are text elements
        if (textElements.length > 0 && canvasRef.current) {
          finalPhoto = await renderTextToCanvas(canvasRef.current, photo);
        }
        
        const link = document.createElement('a');
        link.href = finalPhoto;
        link.download = 'photobooth.jpg';
        link.click();
      } catch (err) {
        console.error('Error downloading photo:', err);
        setError('Failed to download photo');
      }
    };
    
    renderAndDownload();
  }, [photo, textElements]);
  
  // Render text to canvas
  const renderTextToCanvas = async (canvas: HTMLCanvasElement, imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw the image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Draw each text element
        textElements.forEach(el => {
          // Calculate positions based on percentages
          const x = el.x * canvas.width;
          const y = el.y * canvas.height;
          
          // Set text style
          ctx.save();
          
          // Apply transformations
          ctx.translate(x, y);
          ctx.rotate(el.rotation * Math.PI / 180);
          ctx.scale(el.scale, el.scale);
          
          // Set font properties
          const fontSize = el.fontSize * (canvas.width / 500); // Scale font size based on canvas width
          ctx.font = `${fontSize}px ${el.style.fontFamily}`;
          ctx.textBaseline = 'middle';
          
          // Set text alignment
          ctx.textAlign = el.style.align;
          
          // Calculate text width for background
          const textWidth = ctx.measureText(el.text).width;
          const padding = el.style.padding * (canvas.width / 500); // Scale padding based on canvas width
          
          // Draw background if opacity > 0
          if (el.style.backgroundOpacity > 0) {
            ctx.fillStyle = el.style.backgroundColor + Math.round(el.style.backgroundOpacity * 255).toString(16).padStart(2, '0');
            
            let bgX = 0;
            if (el.style.align === 'center') bgX = -textWidth / 2;
            else if (el.style.align === 'right') bgX = -textWidth;
            
            ctx.fillRect(
              bgX - padding,
              -fontSize / 2 - padding,
              textWidth + padding * 2,
              fontSize + padding * 2
            );
          }
          
          // Draw text outline if enabled
          if (el.style.outline) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = fontSize * 0.05;
            ctx.strokeText(el.text, 0, 0);
          }
          
          // Draw text
          ctx.fillStyle = el.color;
          ctx.fillText(el.text, 0, 0);
          
          ctx.restore();
        });
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = imageUrl;
    });
  };
  
  // Upload photo to collage
  const uploadToCollage = useCallback(async () => {
    if (!photo || !currentCollage) return;

    setUploading(true);
    setError(null);
    setIsEditingText(false);
    
    try {
      let finalPhoto = photo;
      
      // First render text onto the photo
      if (textElements.length > 0 && canvasRef.current) {
        console.log('🎨 Rendering text to photo before upload...');
        finalPhoto = await renderTextToCanvas(canvasRef.current, photo);
      }

      const response = await fetch(finalPhoto);
      const blob = await response.blob();
      const file = new File([blob], 'photobooth.jpg', { type: 'image/jpeg' });
      
      await uploadPhoto(currentCollage.id, file);
      
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }, [photo, currentCollage, textElements, uploadPhoto]);
  
  // Add text element
  const addTextElement = useCallback(() => {
    if (!textInput.trim()) return;
    
    const newElement = {
      id: Date.now().toString(),
      text: textInput,
      x: 0.5, // Center of screen horizontally
      y: 0.5, // Center of screen vertically
      style: { ...textStyle },
      fontSize,
      color: textColor,
      rotation: textRotation,
      scale: textScale
    };
    
    setTextElements(prev => [...prev, newElement]);
    setActiveTextId(newElement.id);
    setTextInput('');
  }, [textInput, textStyle, fontSize, textColor, textRotation, textScale]);
  
  // Update text element position
  const updateTextElementPosition = useCallback((id: string, x: number, y: number) => {
    setTextElements(prev => 
      prev.map(el => 
        el.id === id ? { ...el, x, y } : el
      )
    );
  }, []);
  
  // Delete text element
  const deleteTextElement = useCallback((id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id));
    setActiveTextId(null);
  }, []);
  
  // Handle text element drag
  const handleTextDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.preventDefault();
    setActiveTextId(id);
    
    const container = textContainerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    
    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent 
        ? moveEvent.touches[0].clientX 
        : moveEvent.clientX;
      
      const clientY = 'touches' in moveEvent 
        ? moveEvent.touches[0].clientY 
        : moveEvent.clientY;
      
      const x = (clientX - containerRect.left) / containerRect.width;
      const y = (clientY - containerRect.top) / containerRect.height;
      
      updateTextElementPosition(id, 
        Math.max(0, Math.min(1, x)), 
        Math.max(0, Math.min(1, y))
      );
    };
    
    const endHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchend', endHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchend', endHandler);
  }, [updateTextElementPosition]);
  
  // Update active text style
  const updateActiveTextStyle = useCallback((updates: Partial<TextStyle>) => {
    if (!activeTextId) return;
    
    setTextElements(prev => 
      prev.map(el => 
        el.id === activeTextId 
          ? { ...el, style: { ...el.style, ...updates } } 
          : el
      )
    );
    
    setTextStyle(prev => ({ ...prev, ...updates }));
  }, [activeTextId]);
  
  // Update active text color
  const updateActiveTextColor = useCallback((color: string) => {
    if (!activeTextId) return;
    
    setTextElements(prev => 
      prev.map(el => 
        el.id === activeTextId ? { ...el, color } : el
      )
    );
    
    setTextColor(color);
  }, [activeTextId]);
  
  // Update active text font size
  const updateActiveTextFontSize = useCallback((size: number) => {
    if (!activeTextId) return;
    
    setTextElements(prev => 
      prev.map(el => 
        el.id === activeTextId ? { ...el, fontSize: size } : el
      )
    );
    
    setFontSize(size);
  }, [activeTextId]);
  
  // Update active text rotation
  const updateActiveTextRotation = useCallback((rotation: number) => {
    if (!activeTextId) return;
    
    setTextElements(prev => 
      prev.map(el => 
        el.id === activeTextId ? { ...el, rotation } : el
      )
    );
    
    setTextRotation(rotation);
  }, [activeTextId]);
  
  // Update active text scale
  const updateActiveTextScale = useCallback((scale: number) => {
    if (!activeTextId) return;
    
    setTextElements(prev => 
      prev.map(el => 
        el.id === activeTextId ? { ...el, scale } : el
      )
    );
    
    setTextScale(scale);
  }, [activeTextId]);
  
  // Load active text element properties when selected
  useEffect(() => {
    if (activeTextId) {
      const activeElement = textElements.find(el => el.id === activeTextId);
      if (activeElement) {
        setTextStyle(activeElement.style);
        setTextColor(activeElement.color);
        setFontSize(activeElement.fontSize);
        setTextRotation(activeElement.rotation);
        setTextScale(activeElement.scale);
      }
    }
  }, [activeTextId, textElements]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white" style={{ paddingBottom: showTextStylePanel ? '300px' : '0' }}>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/30 text-white"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold">{currentCollage?.name || 'Photobooth'}</h1>
            {currentCollage && (
              <p className="text-xs text-gray-300">Code: {currentCollage.code}</p>
            )}
          </div>
          
          <button
            onClick={() => setShowVideoRecorder(!showVideoRecorder)}
            className="p-2 rounded-full bg-black/30 text-white"
          >
            <Video size={20} />
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="pt-20 pb-20 px-4 flex flex-col items-center justify-center min-h-screen">
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading photobooth...</p>
          </div>
        ) : collageError ? (
          <div className="text-center">
            <p className="text-red-400 mb-4">Error: {collageError}</p>
            <button
              onClick={() => navigate('/join')}
              className="px-4 py-2 bg-purple-600 rounded-lg"
            >
              Try Another Code
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md mx-auto">
            {/* Camera View or Photo Preview */}
            <div 
              className="relative aspect-[3/4] bg-black rounded-lg overflow-hidden shadow-lg border border-gray-700 mb-4"
              ref={textContainerRef}
            >
              {!photo ? (
                // Camera View
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraState === 'active' ? 'opacity-100' : 'opacity-0'}`}
                  />
                  
                  {cameraState === 'starting' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                  )}
                  
                  {cameraState === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4">
                      <p className="text-red-400 mb-4 text-center">
                        {error || 'Could not access camera'}
                      </p>
                      <button
                        onClick={() => setCameraState('idle')}
                        className="px-4 py-2 bg-purple-600 rounded-lg"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // Photo Preview
                <div className="relative w-full h-full">
                  <img 
                    src={photo} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Text Elements */}
                  {textElements.map(el => (
                    <div
                      key={el.id}
                      className={`absolute cursor-move ${activeTextId === el.id ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: `${el.x * 100}%`,
                        top: `${el.y * 100}%`,
                        transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`,
                        fontSize: `${el.fontSize}px`,
                        fontFamily: el.style.fontFamily,
                        color: el.color,
                        backgroundColor: el.style.backgroundOpacity > 0 
                          ? `${el.style.backgroundColor}${Math.round(el.style.backgroundOpacity * 255).toString(16).padStart(2, '0')}` 
                          : 'transparent',
                        padding: `${el.style.padding}px`,
                        textAlign: el.style.align,
                        textShadow: el.style.outline ? '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black' : 'none',
                        zIndex: activeTextId === el.id ? 10 : 1
                      }}
                      onClick={() => setActiveTextId(el.id)}
                      onMouseDown={(e) => handleTextDragStart(e, el.id)}
                      onTouchStart={(e) => handleTextDragStart(e, el.id)}
                    >
                      {el.text}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Canvas for rendering (hidden) */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            {/* Camera Controls */}
            {!photo ? (
              <div className="flex justify-center space-x-4 mb-4">
                {devices.length > 1 && (
                  <button
                    onClick={switchCamera}
                    disabled={cameraState !== 'active'}
                    className="p-4 bg-gray-800 rounded-full disabled:opacity-50"
                  >
                    <SwitchCamera size={24} />
                  </button>
                )}
                
                <button
                  onClick={takePhoto}
                  disabled={cameraState !== 'active'}
                  className="p-6 bg-white rounded-full disabled:opacity-50"
                >
                  <Camera size={32} className="text-black" />
                </button>
                
                {cameraState === 'error' && (
                  <button
                    onClick={() => setCameraState('idle')}
                    className="p-4 bg-gray-800 rounded-full"
                  >
                    <RefreshCw size={24} />
                  </button>
                )}
              </div>
            ) : (
              // Photo Controls
              <div className="space-y-4">
                {/* Text Editing Controls */}
                {isEditingText ? (
                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Add Text</h3>
                      <button
                        onClick={() => {
                          setIsEditingText(false);
                          setActiveTextId(null);
                          setShowTextStylePanel(false);
                        }}
                        className="p-1 bg-gray-700 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Enter text..."
                        className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
                      />
                      <button
                        onClick={addTextElement}
                        disabled={!textInput.trim()}
                        className="px-3 py-2 bg-purple-600 rounded-lg disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    
                    {activeTextId && (
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => setShowTextStylePanel(!showTextStylePanel)}
                          className="text-sm flex items-center text-purple-400"
                        >
                          <Settings size={14} className="mr-1" />
                          {showTextStylePanel ? 'Hide Styles' : 'Edit Styles'}
                        </button>
                        
                        <button
                          onClick={() => deleteTextElement(activeTextId)}
                          className="text-sm flex items-center text-red-400"
                        >
                          <X size={14} className="mr-1" />
                          Delete Text
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center space-x-4 mb-4">
                    <button
                      onClick={retakePhoto}
                      className="p-3 bg-gray-800 rounded-full"
                    >
                      <RefreshCw size={20} />
                    </button>
                    
                    <button
                      onClick={() => setIsEditingText(true)}
                      className="p-3 bg-gray-800 rounded-full"
                    >
                      <Type size={20} />
                    </button>
                    
                    <button
                      onClick={downloadPhoto}
                      className="p-3 bg-gray-800 rounded-full"
                    >
                      <Download size={20} />
                    </button>
                    
                    <button
                      onClick={uploadToCollage}
                      disabled={uploading}
                      className="p-4 bg-purple-600 rounded-full disabled:opacity-50"
                    >
                      {uploading ? (
                        <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={24} />
                      )}
                    </button>
                  </div>
                )}
                
                {/* Action Feedback */}
                {error && (
                  <div className="bg-red-900/50 text-red-200 p-3 rounded-lg text-center text-sm">
                    {error}
                  </div>
                )}
                
                {uploadSuccess && (
                  <div className="bg-green-900/50 text-green-200 p-3 rounded-lg text-center text-sm">
                    Photo uploaded successfully!
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Text Style Panel */}
      {showTextStylePanel && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-20">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Text Styles</h3>
              <button
                onClick={() => setShowTextStylePanel(false)}
                className="p-1 bg-gray-700 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Text Color */}
            <div>
              <label className="block text-sm mb-1">Text Color</label>
              <div className="flex space-x-2">
                {['#ffffff', '#000000', '#ff3b30', '#4cd964', '#007aff', '#ffcc00', '#ff9500', '#5856d6'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateActiveTextColor(color)}
                    className={`w-8 h-8 rounded-full ${textColor === color ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => updateActiveTextColor(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer"
                />
              </div>
            </div>
            
            {/* Background Color */}
            <div>
              <label className="block text-sm mb-1">Background Color</label>
              <div className="flex space-x-2">
                {['#000000', '#ffffff', '#ff3b30', '#4cd964', '#007aff', '#ffcc00', '#ff9500', '#5856d6'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateActiveTextStyle({ backgroundColor: color })}
                    className={`w-8 h-8 rounded-full ${textStyle.backgroundColor === color ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={textStyle.backgroundColor}
                  onChange={(e) => updateActiveTextStyle({ backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded-full cursor-pointer"
                />
              </div>
            </div>
            
            {/* Background Opacity */}
            <div>
              <label className="block text-sm mb-1">
                Background Opacity: {Math.round(textStyle.backgroundOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={textStyle.backgroundOpacity}
                onChange={(e) => updateActiveTextStyle({ backgroundOpacity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            {/* Font Size */}
            <div>
              <label className="block text-sm mb-1">
                Font Size: {fontSize}px
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateActiveTextFontSize(Math.max(12, fontSize - 2))}
                  className="p-1 bg-gray-700 rounded"
                >
                  <ZoomOut size={16} />
                </button>
                <input
                  type="range"
                  min="12"
                  max="72"
                  value={fontSize}
                  onChange={(e) => updateActiveTextFontSize(parseInt(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => updateActiveTextFontSize(Math.min(72, fontSize + 2))}
                  className="p-1 bg-gray-700 rounded"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>
            
            {/* Text Alignment */}
            <div>
              <label className="block text-sm mb-1">Text Alignment</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => updateActiveTextStyle({ align: 'left' })}
                  className={`p-2 rounded ${textStyle.align === 'left' ? 'bg-purple-600' : 'bg-gray-700'}`}
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={() => updateActiveTextStyle({ align: 'center' })}
                  className={`p-2 rounded ${textStyle.align === 'center' ? 'bg-purple-600' : 'bg-gray-700'}`}
                >
                  <AlignCenter size={16} />
                </button>
                <button
                  onClick={() => updateActiveTextStyle({ align: 'right' })}
                  className={`p-2 rounded ${textStyle.align === 'right' ? 'bg-purple-600' : 'bg-gray-700'}`}
                >
                  <AlignRight size={16} />
                </button>
              </div>
            </div>
            
            {/* Text Outline */}
            <div className="flex items-center space-x-2">
              <label className="text-sm">Text Outline</label>
              <button
                onClick={() => updateActiveTextStyle({ outline: !textStyle.outline })}
                className={`px-3 py-1 rounded ${textStyle.outline ? 'bg-purple-600' : 'bg-gray-700'}`}
              >
                {textStyle.outline ? 'On' : 'Off'}
              </button>
            </div>
            
            {/* Rotation */}
            <div>
              <label className="block text-sm mb-1">
                Rotation: {textRotation}°
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                value={textRotation}
                onChange={(e) => updateActiveTextRotation(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            {/* Scale */}
            <div>
              <label className="block text-sm mb-1">
                Size Scale: {textScale.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={textScale}
                onChange={(e) => updateActiveTextScale(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Video Recorder */}
      {showVideoRecorder && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/50 backdrop-blur-md p-4 rounded-lg border border-white/20">
          <MobileVideoRecorder 
            canvasRef={canvasRef} 
            onClose={() => setShowVideoRecorder(false)}
          />
        </div>
      )}
    </div>
  );
};

export default PhotoboothPage;