import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Re-export PARTICLE_THEMES from MilkyWayParticleSystem
export { PARTICLE_THEMES } from './MilkyWayParticleSystem';

interface LandingParticleBackgroundProps {
  className?: string;
}

// Simplified particle system for landing page
const LandingParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particleData = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Distribute particles in a large sphere
      const radius = Math.random() * 100 + 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Purple/blue color scheme
      const color = new THREE.Color();
      color.setHSL(
        0.7 + Math.random() * 0.2, // Purple to blue hue
        0.6 + Math.random() * 0.4, // Saturation
        0.3 + Math.random() * 0.5   // Lightness
      );
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      sizes[i] = 0.5 + Math.random() * 2;
    }
    
    return { positions, colors, sizes, count };
  }, []);
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.1;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={particleData.positions}
          count={particleData.count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={particleData.colors}
          count={particleData.count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          array={particleData.sizes}
          count={particleData.count}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        vertexShader={`
          attribute float size;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
            if (distanceToCenter > 0.5) discard;
            
            float alpha = 1.0 - (distanceToCenter * 2.0);
            alpha = smoothstep(0.0, 1.0, alpha);
            
            gl_FragColor = vec4(vColor, alpha * 0.6);
          }
        `}
      />
    </points>
  );
};

const LandingParticleBackground: React.FC<LandingParticleBackgroundProps> = ({ className }) => {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <LandingParticles />
      </Canvas>
    </div>
  );
};

export default LandingParticleBackground;