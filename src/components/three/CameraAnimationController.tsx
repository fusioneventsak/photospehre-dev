import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraAnimationControllerProps {
  config: {
    enabled: boolean;
    type: 'none' | 'orbit' | 'figure8' | 'centerRotate' | 'wave' | 'spiral';
    speed: number;
    radius: number;
    height: number;
    amplitude: number;
    frequency: number;
  };
}

export const CameraAnimationController: React.FC<CameraAnimationControllerProps> = ({ config }) => {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const userInteractingRef = useRef(false);
  const lastInteractionRef = useRef(0);

  // PERFECT SEAMLESS LOOP FUNCTIONS - These guarantee no stuttering
  const getAnimationPosition = (time: number): THREE.Vector3 => {
    const t = time * config.speed;
    
    switch (config.type) {
      case 'figure8':
        // PERFECT Figure-8: Uses parametric equations for seamless loop
        return new THREE.Vector3(
          Math.sin(t) * config.radius,                    // X oscillates once per cycle
          config.height + Math.sin(t * 3) * 2,           // Gentle Y variation
          Math.sin(t * 2) * config.amplitude             // Z oscillates twice per cycle = figure-8
        );

      case 'centerRotate':
        // PERFECT Center Focus: 20-second cycle with 3 phases
        const cycleTime = 20;
        const phase = (t % cycleTime) / cycleTime;        // 0 to 1, seamless wrap
        const angle = t * 2;                              // Continuous rotation
        
        let currentRadius: number;
        let currentHeight: number;
        
        if (phase < 0.3) {
          // Phase 1: Spiral inward (0-30% of cycle)
          const phaseT = phase / 0.3;                     // 0 to 1 within phase
          currentRadius = config.radius * (1 - phaseT * 0.8);
          currentHeight = config.height + Math.sin(phaseT * Math.PI) * 5;
        } else if (phase < 0.7) {
          // Phase 2: Center rotation (30-70% of cycle)
          currentRadius = config.radius * 0.2;
          currentHeight = config.height * 0.6;
        } else {
          // Phase 3: Spiral outward (70-100% of cycle)
          const phaseT = (phase - 0.7) / 0.3;            // 0 to 1 within phase
          currentRadius = config.radius * (0.2 + phaseT * 0.8);
          currentHeight = config.height + Math.sin(phaseT * Math.PI) * 5;
        }
        
        return new THREE.Vector3(
          Math.cos(angle) * currentRadius,
          currentHeight,
          Math.sin(angle) * currentRadius
        );

      case 'orbit':
        // PERFECT Orbit: Simple circular motion
        return new THREE.Vector3(
          Math.cos(t) * config.radius,
          config.height,
          Math.sin(t) * config.radius
        );

      case 'wave':
        // PERFECT Wave: Radius oscillates while orbiting
        const waveRadius = config.radius + Math.sin(t * config.frequency) * config.amplitude;
        return new THREE.Vector3(
          Math.cos(t) * waveRadius,
          config.height + Math.sin(t * config.frequency * 2) * 3,
          Math.sin(t) * waveRadius
        );

      case 'spiral':
        // PERFECT Spiral: Expanding/contracting with height variation
        const spiralMod = 1 + Math.sin(t * config.frequency) * 0.3;
        return new THREE.Vector3(
          Math.cos(t * 2) * config.radius * spiralMod,
          config.height + Math.sin(t * config.frequency * 0.5) * config.amplitude,
          Math.sin(t * 2) * config.radius * spiralMod
        );

      default:
        return camera.position.clone();
    }
  };

  // User interaction detection
  React.useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleInteractionStart = () => {
      userInteractingRef.current = true;
      lastInteractionRef.current = Date.now();
    };

    const handleInteractionEnd = () => {
      lastInteractionRef.current = Date.now();
      setTimeout(() => userInteractingRef.current = false, 1000);
    };

    canvas.addEventListener('mousedown', handleInteractionStart);
    canvas.addEventListener('touchstart', handleInteractionStart);
    canvas.addEventListener('wheel', handleInteractionStart);
    canvas.addEventListener('mouseup', handleInteractionEnd);
    canvas.addEventListener('touchend', handleInteractionEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleInteractionStart);
      canvas.removeEventListener('touchstart', handleInteractionStart);
      canvas.removeEventListener('wheel', handleInteractionStart);
      canvas.removeEventListener('mouseup', handleInteractionEnd);
      canvas.removeEventListener('touchend', handleInteractionEnd);
    };
  }, []);

  useFrame((state, delta) => {
    if (!config.enabled || config.type === 'none') return;
    
    timeRef.current += delta;
    
    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const shouldAnimate = !userInteractingRef.current && timeSinceInteraction > 1000;
    
    if (shouldAnimate) {
      const targetPosition = getAnimationPosition(timeRef.current);
      
      // Smooth transition with proper blending
      if (timeSinceInteraction < 3000) {
        const blendFactor = Math.min((timeSinceInteraction - 1000) / 2000, 1);
        camera.position.lerp(targetPosition, blendFactor * 0.02);
      } else {
        camera.position.lerp(targetPosition, 0.01);
      }
      
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
};