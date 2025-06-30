export class UploadOptimizer {
  static async compressImage(file: File): Promise<File> {
    // Skip compression for small files (less than 200KB)
    if (file.size < 200 * 1024) {
      console.log('Skipping compression for small file:', file.name);
      return file;
    }
    
    // Skip compression for non-image files
    if (!file.type.startsWith('image/')) {
      console.log('Skipping compression for non-image file:', file.name);
      return file;
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      // Set up error handling - return original file if compression fails
      const handleError = () => {
        console.warn('Image compression failed, using original file:', file.name);
        resolve(file);
      };

      img.onerror = handleError;

      img.onload = () => {
        try {
          // Calculate target dimensions
          const maxWidth = 1200;
          const maxHeight = 1200;
          
          let { width, height } = img;
          
          // Preserve aspect ratio while resizing
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with quality setting
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Create new file from blob
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                
                // Log compression results
                const originalSize = file.size / 1024;
                const compressedSize = compressedFile.size / 1024;
                const savingsPercent = ((file.size - compressedFile.size) / file.size) * 100;
                
                console.log(`Compressed ${file.name}: ${originalSize.toFixed(1)}KB → ${compressedSize.toFixed(1)}KB (${savingsPercent.toFixed(1)}% reduction)`);
                
                resolve(compressedFile);
              } else {
                console.warn('Blob creation failed, using original file');
                resolve(file);
              }
            },
            'image/jpeg',
            0.8 // Quality setting (0-1)
          );
        } catch (error) {
          console.error('Error during image compression:', error);
          resolve(file);
        }
      };

      // Load image from file
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          handleError();
        }
      };
      reader.onerror = handleError;
      
      // Start reading the file
      reader.readAsDataURL(file);
    });
  }
}