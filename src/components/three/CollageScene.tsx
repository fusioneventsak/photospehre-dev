Here's the fixed version with all missing closing brackets added:

```typescript
// At the end of the useEffect in PhotoMesh component:
    loader.load(
      imageUrl,
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

// At the end of the useFrame in PhotoMesh component:
  useFrame(() => {
    if (!meshRef.current) return;
    
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

```

These were the main missing closing brackets in the code. The rest of the code structure appears to be properly closed. The fixes ensure that:

1. The texture loading useEffect has proper cleanup
2. The camera-facing useFrame hook is properly closed
3. All function blocks are properly terminated

The code should now compile and run without syntax errors.