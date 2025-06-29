I've analyzed the code and found several missing closing brackets and duplicated code sections. Here's the fixed version with proper closings:

1. The `takePhoto` function was missing its closing bracket. Added `}` after the canvas operations.

2. There was a duplicated `fetch(finalPhoto)` section in the `uploadToCollage` function.

3. The `downloadPhoto` callback was missing its closing bracket.

Here's the corrected version of those sections:

```typescript
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
  }
}, [cameraState]);

// Upload to collage
const uploadToCollage = useCallback(async () => {
  if (!photo || !currentCollage) return;

  setUploading(true);
  setError(null);
  setIsEditingText(false);
  
  try {
    // First render text onto the photo
    let finalPhoto = photo;
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
```

The rest of the code appears to be properly structured with matching brackets. The component exports and other function definitions are correctly closed.