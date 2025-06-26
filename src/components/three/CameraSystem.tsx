import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
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

// Available camera modes
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
      enableOrbit: false,
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
      enableOrbit: false,
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
      enableOrbit: false,
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
  // Ensure we have at least two keyframes
  if (keyframes.length < 2) {
    console.warn('Cinematic path requires at least two keyframes');
    return null;
  }

  // Create position and target curves
  const positionCurve = new THREE.CatmullRomCurve3(
    keyframes.map(kf => new THREE.Vector3(...kf.position))
  );
  
  const targetCurve = new THREE.CatmullRomCurve3(
    keyframes.map(kf => new THREE.Vector3(...kf.target))
  );

  // Calculate total duration
  const totalDuration = keyframes.reduce((sum, kf) => sum + kf.duration, 0);
  
  // Create timing map for interpolation
  const timingMap = keyframes.reduce((result, kf, index) => {
    const prevTime = index > 0 ? result[index - 1] : 0;
    result.push(prevTime + kf.duration / totalDuration);
    return result;
  }, [] as number[]);

  return {
    positionCurve,
    targetCurve,
    timingMap,
    totalDuration,
    keyframes
  };
};

// Generate optimal camera path based on photo positions
export const generateOptimalPath = (
  photos: { targetPosition: [number, number, number] }[],
  settings: SceneSettings
) => {
  if (!photos || photos.length === 0) {
    return null;
  }

  // Extract photo positions
  const positions = photos
    .filter(p => p.targetPosition)
    .map(p => new THREE.Vector3(...p.targetPosition));

  if (positions.length === 0) {
    return null;
  }

  // Calculate bounding box of all photos
  const box = new THREE.Box3().setFromPoints(positions);
  const center = new THREE.Vector3();
  box.getCenter(center);
  
  // Calculate size and optimal distance
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const optimalDistance = maxDim * 1.5;

  // Create keyframes that orbit around the center
  const keyframes: CameraKeyframe[] = [];
  const numPoints = 8; // Number of points around the orbit
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const height = center.y + size.y * 0.5 + Math.sin(angle * 2) * size.y * 0.3;
    
    keyframes.push({
      position: [
        center.x + Math.cos(angle) * optimalDistance,
        height,
        center.z + Math.sin(angle) * optimalDistance
      ],
      target: [center.x, center.y, center.z],
      fov: 75,
      duration: 5.0 // seconds per segment
    });
  }

  return createCinematicPath(keyframes);
};

// Main camera controller component
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

  // Handle user interaction detection
  useEffect(() => {
    if (!controlsRef.current) return;

    const handleStart = () => {
      userInteractingRef.current = true;
      lastInteractionTimeRef.current = Date.now();
    };

    const handleEnd = () => {
      lastInteractionTimeRef.current = Date.now();
      setTimeout(() => {
        userInteractingRef.current = false;
      }, 500);
    };

    const controls = controlsRef.current;
    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
    };
  }, []);

  // Handle cinematic path following
  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    // Handle transitions between camera positions
    if (transitionData) {
      const elapsed = state.clock.elapsedTime - transitionData.startTime;
      const progress = Math.min(elapsed / transitionData.duration, 1);
      
      // Apply easing
      let easedProgress = progress;
      if (CAMERA_MODES[cameraMode]?.transitions.easing === 'easeInOut') {
        easedProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      } else if (CAMERA_MODES[cameraMode]?.transitions.easing === 'easeIn') {
        easedProgress = progress * progress;
      } else if (CAMERA_MODES[cameraMode]?.transitions.easing === 'easeOut') {
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
    // Handle cinematic path following
    else if (cameraMode === 'cinematic' && cinematicPath && !userInteractingRef.current) {
      cinematicTimeRef.current += delta;
      
      // Loop through the path
      const loopTime = cinematicTimeRef.current % cinematicPath.totalDuration;
      const normalizedTime = loopTime / cinematicPath.totalDuration;
      
      // Find the appropriate segment
      let segmentIndex = 0;
      while (segmentIndex < cinematicPath.timingMap.length - 1 && 
             normalizedTime > cinematicPath.timingMap[segmentIndex]) {
        segmentIndex++;
      }
      
      // Get position and target from curves
      const position = cinematicPath.positionCurve.getPoint(normalizedTime);
      const target = cinematicPath.targetCurve.getPoint(normalizedTime);
      
      // Apply to camera
      camera.position.copy(position);
      controlsRef.current.target.copy(target);
      targetRef.current.copy(target);
      controlsRef.current.update();
    }
    // Handle auto rotation when enabled
    else if (settings.cameraRotationEnabled && !userInteractingRef.current) {
      const offset = new THREE.Vector3().copy(camera.position).sub(controlsRef.current.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      
      spherical.theta += (settings.cameraRotationSpeed || 0.5) * delta;
      
      const newPosition = new THREE.Vector3().setFromSpherical(spherical).add(controlsRef.current.target);
      camera.position.copy(newPosition);
      controlsRef.current.update();
    }
  });

  // Function to transition to a new camera position
  const transitionToPosition = (
    newPosition: THREE.Vector3,
    newTarget: THREE.Vector3,
    duration: number = 1.0
  ) => {
    setTransitionData({
      startPosition: camera.position.clone(),
      endPosition: newPosition,
      startTarget: targetRef.current.clone(),
      endTarget: newTarget,
      startTime: performance.now() / 1000,
      duration
    });
  };

  // Function to switch to a specific keyframe in the cinematic path
  const goToKeyframe = (index: number) => {
    if (!cinematicPath || index >= cinematicPath.keyframes.length) {
      return;
    }
    
    const keyframe = cinematicPath.keyframes[index];
    const newPosition = new THREE.Vector3(...keyframe.position);
    const newTarget = new THREE.Vector3(...keyframe.target);
    
    transitionToPosition(
      newPosition,
      newTarget,
      CAMERA_MODES[cameraMode]?.transitions.duration || 1.0
    );
  };

  // Determine which controls to enable based on camera mode
  const currentMode = CAMERA_MODES[cameraMode] || CAMERA_MODES.orbit;
  
  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enabled={currentMode.controls.enableOrbit && settings.cameraEnabled !== false}
        enablePan={currentMode.controls.enableOrbit}
        enableZoom={true}
        enableRotate={currentMode.controls.enableOrbit}
        minDistance={5}
        maxDistance={200}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI - Math.PI / 6}
        enableDamping={true}
        dampingFactor={0.05}
        zoomSpeed={1.0}
        rotateSpeed={1.0}
        panSpeed={1.0}
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