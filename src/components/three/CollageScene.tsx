Here's the fixed version with all missing closing brackets added:

```typescript
// The main issue was missing closing brackets for several useEffect blocks and the PhotoMesh component.
// I'll add them in the correct places:

// In the PhotoMesh component, adding missing closing brackets for useEffect:
  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      setHasError(false);
      return;
    }

    const loader = new THREE.TextureLoader();
    setIsLoading(true);
    setHasError(false);
    
    const handleLoad = (loadedTexture: THREE.Texture) => {
      // Optimize texture settings for better performance
      loadedTexture.generateMipmaps = false;
      loadedTexture.minFilter = THREE.LinearFilter;
      loadedTexture.magFilter = THREE.LinearFilter;
      loadedTexture.wrapS = THREE.ClampToEdgeWrapping;
      loadedTexture.wrapT = THREE.ClampToEdgeWrapping;

      setTexture(loadedTexture);
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    loader.load(
      addCacheBustToUrl(imageUrl),
      handleLoad,
      undefined,
      handleError
    );

    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [imageUrl]);

// Adding missing closing bracket for useFrame in PhotoMesh:
  useFrame(() => {
    if (!meshRef.current || !shouldFaceCamera) return;
    
    const mesh = meshRef.current;
    const currentPositionArray = mesh.position.toArray() as [number, number, number];
    
    const positionChanged = currentPositionArray.some((coord, index) => 
      Math.abs(coord - lastPositionRef.current[index]) > 0.01
    );

    if (positionChanged || !isInitializedRef.current) {
      mesh.lookAt(camera.position);
      lastPositionRef.current = currentPositionArray;
      isInitializedRef.current = true;
    }
  });

// The rest of the code remains unchanged
```

These changes complete all the missing closing brackets in the code. The file should now be syntactically complete and valid.