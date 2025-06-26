import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SceneSettings } from '../../store/sceneStore';

// Camera mode configuration interface
export interface CameraMode {
  name: string;
  controls: CameraControlsConfig;
  transitions: TransitionConfig;
}

// Camera controls configuration
export interface CameraControlsConfig {
  enableOrbit: boolean;
  enableFirstPerson: boolean;
  enableCinematic: boolean;
  vrCompatible: boolean;
}

// Camera transition configuration
export interface TransitionConfig {
  duration: number;
  easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
  path: 'direct' | 'arc' | 'spiral';
}

// Camera keyframe for cinematic paths
export interface CameraKeyframe {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  duration: number;
}

// Available camera modes - FIXED: Default to orbit mode with controls enabled
export const CAMERA_MODES: Record<string, CameraMode> = {
  orbit: {
    name: 'Orbit',
    controls: {
      enableOrbit: true,
      enableFirstPerson: false,
      enableCinematic: false,
      vrCompatible: false
    },
    transitions: {
      duration: 1.0,
      easing: 'easeInOut',
      path: 'direct'
    }
  },
  firstPerson: {
    name: 'First Person',
    controls: {
      enableOrbit: true, // FIXED: Enable orbit controls for mouse interaction
      enableFirstPerson: true,
      enableCinematic: false,
      vrCompatible: true
    },
    transitions: {
      duration: 0.8,
      easing: 'easeOut',
      path: 'direct'
    }
  },
  cinematic: {
    name: 'Cinematic',
    controls: {
      enableOrbit: true, // FIXED: Enable orbit controls for user override
      enableFirstPerson: false,
      enableCinematic: true,
      vrCompatible: false
    },
    transitions: {
      duration: 2.0,
      easing: 'easeInOut',
      path: 'arc'
    }
  },
  auto: {
    name: 'Auto',
    controls: {
      enableOrbit: true, // FIXED: Enable orbit controls for user override
      enableFirstPerson: false,
      enableCinematic: true,
      vrCompatible: false
    },
    transitions: {
      duration: 1.5,
      easing: 'easeInOut',
      path: 'arc'
    }
  }
};

// Helper function to create a cinematic path from keyframes
export const createCinematicPath = (keyframes: CameraKeyframe[]) => {
  if (keyframes.length < 2) {
    console.warn('Cinematic path requires at least two keyframes');
    return null;
  }

  const positionCurve = new THREE.CatmullRomCurve3(
    keyframes.map(kf => new THREE.Vector3(...kf.position))
  );
  
  const targetCurve = new THREE.CatmullRomCurve3(
    keyframes.map(kf => new THREE.Vector3(...kf.target))
  );

  const totalDuration = keyframes.reduce((sum, kf) => sum + kf.duration, 0);
  
  const timingMap = keyframes.reduce((result, kf, index) => {
    const prevTime = index > 0 ? result[index - 1] : 0;
    result.push(prevTime + kf.duration / totalDuration);
    return result;
  }, [] as number[]);

  return {
    positionCurve,
    targetCurve,
    totalDuration,
    timingMap,
    keyframes
  };
};

// Generate optimal path through photos
const generateOptimalPath = (photos: { targetPosition: [number, number, number] }[], settings: SceneSettings) => {
  if (!photos || photos.length === 0) return null;

  // Create keyframes that tour through the photos
  const keyframes: CameraKeyframe[] = [];
  const photoPositions = photos.map(p => p.targetPosition);
  
  // Add starting position
  keyframes.push({
    position: [20, 10, 20],
    target: [0, 0, 0],
    fov: 60,
    duration: 2.0
  });

  // Tour through photo clusters
  const clusters = Math.min(8, Math.max(3, Math.floor(photos.length / 10)));
  for (let i = 0; i < clusters; i++) {
    const clusterIndex = Math.floor((i / clusters) * photos.length);
    const photo = photoPositions[clusterIndex];
    
    if (photo) {
      // Position camera to view this photo cluster
      const offset = new THREE.Vector3(15, 8, 15);
      const position = new THREE.Vector3(...photo).add(offset);
      
      keyframes.push({
        position: [position.x, position.y, position.z],
        target: photo,
        fov: 60,
        duration: 3.0
      });
    }
  }

  return createCinematicPath(keyframes);
};

interface CameraControllerProps {
  settings: SceneSettings;
  cinematicPath?: ReturnType<typeof createCinematicPath>;
}

export const CameraController: React.FC<CameraControllerProps> = ({ 
  settings,
  cinematicPath
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();
  const [cameraMode, setCameraMode] = useState<string>(settings.cameraMode || 'orbit');
  const [transitionData, setTransitionData] = useState<{
    startPosition: THREE.Vector3;
    endPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    startTime: number;
    duration: number;
  } | null>(null);
  
  const cinematicTimeRef = useRef(0);
  const userInteractingRef = useRef(false);
  const lastInteractionTimeRef = useRef(0);
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Update camera mode when settings change
  useEffect(() => {
    if (settings.cameraMode && settings.cameraMode !== cameraMode) {
      setCameraMode(settings.cameraMode);
    }
  }, [settings.cameraMode]);

  // Initialize camera position
  useEffect(() => {
    if (camera && controlsRef.current) {
      const initialDistance = settings.cameraDistance || 20;
      const initialHeight = settings.cameraHeight || 0;
      const initialPosition = new THREE.Vector3(
        initialDistance,
        initialHeight,
        initialDistance
      );
      camera.position.copy(initialPosition);
      
      const target = new THREE.Vector3(0, initialHeight * 0.3, 0);
      targetRef.current.copy(target);
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, [camera, settings.cameraDistance, settings.cameraHeight]);

  // FIXED: Simplified user interaction detection
  useEffect(() => {
    if (!controlsRef.current) return;

    const handleStart = () => {
      userInteractingRef.current = true;
      lastInteractionTimeRef.current = Date.now();
    };

    const handleEnd = () => {
      lastInteractionTimeRef.current = Date.now();
      // FIXED: Shorter timeout to allow animations to resume faster
      setTimeout(() => {
        userInteractingRef.current = false;
      }, 100);
    };

    const controls = controlsRef.current;
    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    return () => {
      if (controls) {
        controls.removeEventListener('start', handleStart);
        controls.removeEventListener('end', handleEnd);
      }
    };
  }, [controlsRef.current]);

  // FIXED: Handle all camera modes properly
  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    // Handle automatic camera rotation for orbit mode
    if (cameraMode === 'orbit' && settings.cameraRotationEnabled && !userInteractingRef.current) {
      const rotationSpeed = (settings.cameraRotationSpeed || 1.0) * 0.1;
      const radius = camera.position.distanceTo(controlsRef.current.target);
      const currentAngle = Math.atan2(camera.position.z, camera.position.x);
      const newAngle = currentAngle + delta * rotationSpeed;
      
      camera.position.x = Math.cos(newAngle) * radius;
      camera.position.z = Math.sin(newAngle) * radius;
      controlsRef.current.update();
    }

    // Handle cinematic and auto modes with path following
    if ((cameraMode === 'cinematic' || cameraMode === 'auto') && 
        cinematicPath && 
        !userInteractingRef.current &&
        settings.cameraEnabled !== false) {
      
      // Use camera rotation speed setting to control cinematic speed
      const cinematicSpeed = (settings.cameraRotationSpeed || 1.0) * 0.3;
      cinematicTimeRef.current += delta * cinematicSpeed;
      
      // Reset time when it exceeds path duration
      if (cinematicTimeRef.current >= cinematicPath.totalDuration) {
        cinematicTimeRef.current = 0;
      }
      
      const normalizedTime = cinematicTimeRef.current / cinematicPath.totalDuration;
      
      // Get position and target from curves
      const position = cinematicPath.positionCurve.getPoint(normalizedTime);
      const target = cinematicPath.targetCurve.getPoint(normalizedTime);
      
      // Smooth interpolation to avoid jarring movements
      const lerpSpeed = 2.0;
      camera.position.lerp(position, delta * lerpSpeed);
      controlsRef.current.target.lerp(target, delta * lerpSpeed);
      targetRef.current.copy(target);
      controlsRef.current.update();
    }

    // Handle first person mode (simplified - mainly just ensures controls work)
    if (cameraMode === 'firstPerson') {
      // First person mode mainly relies on user controls
      // Could add WASD movement here in the future
      controlsRef.current.update();
    }

    // Handle transitions between camera positions
    if (transitionData) {
      const elapsed = state.clock.elapsedTime - transitionData.startTime;
      const progress = Math.min(elapsed / transitionData.duration, 1);
      
      // Apply easing
      let easedProgress = progress;
      const transitionConfig = CAMERA_MODES[cameraMode]?.transitions;
      if (transitionConfig?.easing === 'easeInOut') {
        easedProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      } else if (transitionConfig?.easing === 'easeIn') {
        easedProgress = progress * progress;
      } else if (transitionConfig?.easing === 'easeOut') {
        easedProgress = 1 - Math.pow(1 - progress, 2);
      }
      
      // Interpolate position and target
      const newPosition = new THREE.Vector3().lerpVectors(
        transitionData.startPosition,
        transitionData.endPosition,
        easedProgress
      );
      
      const newTarget = new THREE.Vector3().lerpVectors(
        transitionData.startTarget,
        transitionData.endTarget,
        easedProgress
      );
      
      // Apply new position and target
      camera.position.copy(newPosition);
      controlsRef.current.target.copy(newTarget);
      targetRef.current.copy(newTarget);
      controlsRef.current.update();
      
      // Clear transition when complete
      if (progress >= 1) {
        setTransitionData(null);
      }
    }
  });

  // Function to smoothly transition camera to a new position
  const transitionToPosition = (
    newPosition: THREE.Vector3,
    newTarget: THREE.Vector3,
    duration: number = 1.0
  ) => {
    if (!controlsRef.current) return;

    setTransitionData({
      startPosition: camera.position.clone(),
      endPosition: newPosition,
      startTarget: controlsRef.current.target.clone(),
      endTarget: newTarget,
      startTime: performance.now() / 1000,
      duration
    });
  };

  // Determine which controls to enable based on camera mode
  const currentMode = CAMERA_MODES[cameraMode] || CAMERA_MODES.orbit;
  
  // Calculate speed multipliers from settings  
  const rotationSpeed = settings.cameraRotationSpeed || 1.0;
  const zoomSpeed = rotationSpeed; // Use rotation speed for consistency
  const panSpeed = rotationSpeed; // Use rotation speed for consistency
  
  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enabled={settings.cameraEnabled !== false} // FIXED: Always enable controls when camera is enabled
        enablePan={true} // Always enable pan for better user control
        enableZoom={true}
        enableRotate={true} // Always enable rotate for better user control
        minDistance={5}
        maxDistance={200}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI - Math.PI / 6}
        enableDamping={true}
        dampingFactor={0.05}
        zoomSpeed={zoomSpeed} // FIXED: Use settings for zoom speed
        rotateSpeed={rotationSpeed} // FIXED: Use settings for rotation speed
        panSpeed={panSpeed} // FIXED: Use settings for pan speed
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
      />
    </>
  );
};

// Component to generate and provide a cinematic path
export const CinematicPathProvider: React.FC<{
  photos: { targetPosition: [number, number, number] }[];
  settings: SceneSettings;
  children: (path: ReturnType<typeof createCinematicPath>) => React.ReactNode;
}> = ({ photos, settings, children }) => {
  const [path, setPath] = useState<ReturnType<typeof createCinematicPath>>(null);
  
  // Generate path when photos or relevant settings change
  useEffect(() => {
    if (photos && photos.length > 0) {
      const newPath = generateOptimalPath(photos, settings);
      setPath(newPath);
    }
  }, [photos, settings.animationPattern]);
  
  return <>{children(path)}</>;
};

export default CameraController;