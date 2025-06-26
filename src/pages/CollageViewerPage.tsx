// src/components/CollageScene.tsx - FIXED: Proper lighting and empty state handling
import React, { useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useCollageStore } from '../store/collageStore';

interface Photo {
  id: string;
  url: string;
  created_at: string;
}

interface SceneSettings {
  photoCount?: number;
  backgroundColor?: string;
  backgroundGradient?: boolean;
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundGradientAngle?: number;
  ambientLightIntensity?: number;
  spotlightIntensity?: number;
  cameraDistance?: number;
  cameraHeight?: number;
  cameraRotationEnabled?: boolean;
  cameraRotationSpeed?: number;
  showFloor?: boolean;
  floorColor?: string;
  showGrid?: boolean;
  shadowsEnabled?: boolean;
  [key: string]: any;
}

interface CollageSceneProps {
  photos?: Photo[];
  settings?: Partial<SceneSettings>;
}

// Default settings with good lighting
const DEFAULT_SETTINGS: SceneSettings = {
  photoCount: 50,
  backgroundColor: '#1a1a1a',
  backgroundGradient: false,
  backgroundGradientStart: '#000000',
  backgroundGradientEnd: '#1a1a1a',
  backgroundGradientAngle: 45,
  ambientLightIntensity: 0.6,
  spotlightIntensity: 1.0,
  cameraDistance: 20,
  cameraHeight: 0,
  cameraRotationEnabled: false,
  cameraRotationSpeed: 0.5,
  showFloor: true,
  floorColor: '#2a2a2a',
  showGrid: false,
  shadowsEnabled: true
};

// Simple photo component for testing
const SimplePhoto: React.FC<{ position: [number, number, number]; photoUrl: string }> = ({ position, photoUrl }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      photoUrl,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
        // Create a placeholder texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#666666';
          ctx.fillRect(0, 0, 256, 256);
          ctx.fillStyle = '#ffffff';
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Photo', 128, 128);
        }
        const fallbackTexture = new THREE.CanvasTexture(canvas);
        setTexture(fallbackTexture);
      }
    );
  }, [photoUrl]);

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <planeGeometry args={[3, 2]} />
      <meshStandardMaterial 
        map={texture} 
        side={THREE.DoubleSide}
        transparent={false}
        alphaTest={0.1}
      />
    </mesh>
  );
};

// Placeholder photo for empty state
const PlaceholderPhoto: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <mesh position={position}>
      <planeGeometry args={[3, 2]} />
      <meshStandardMaterial 
        color="#444444" 
        transparent={true} 
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Scene lighting component
const SceneLighting: React.FC<{ settings: SceneSettings }> = ({ settings }) => {
  return (
    <>
      {/* Ambient light for overall scene illumination */}
      <ambientLight 
        intensity={settings.ambientLightIntensity || 0.6} 
        color="#ffffff" 
      />
      
      {/* Key light from top-front */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={settings.spotlightIntensity || 1.0}
        color="#ffffff"
        castShadow={settings.shadowsEnabled}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Fill light from the side */}
      <directionalLight
        position={[-5, 5, 5]}
        intensity={(settings.spotlightIntensity || 1.0) * 0.3}
        color="#ffffff"
      />
      
      {/* Back light for rim lighting */}
      <directionalLight
        position={[0, 5, -10]}
        intensity={(settings.spotlightIntensity || 1.0) * 0.2}
        color="#ffffff"
      />
    </>
  );
};

// Floor component
const Floor: React.FC<{ settings: SceneSettings }> = ({ settings }) => {
  if (!settings.showFloor) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial 
        color={settings.floorColor || '#2a2a2a'} 
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
};

// Camera controller
const CameraController: React.FC<{ settings: SceneSettings }> = ({ settings }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();

  // Set initial camera position
  useEffect(() => {
    if (camera) {
      const distance = settings.cameraDistance || 20;
      const height = settings.cameraHeight || 0;
      camera.position.set(distance * 0.7, height + 5, distance * 0.7);
      camera.lookAt(0, height, 0);
    }
  }, [camera, settings.cameraDistance, settings.cameraHeight]);

  // Auto rotation
  useFrame((state, delta) => {
    if (settings.cameraRotationEnabled && controlsRef.current) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = (settings.cameraRotationSpeed || 0.5) * 10;
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={100}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI - Math.PI / 6}
      enableDamping={true}
      dampingFactor={0.05}
      autoRotate={settings.cameraRotationEnabled || false}
      autoRotateSpeed={(settings.cameraRotationSpeed || 0.5) * 10}
    />
  );
};

// Photo grid layout
const PhotoGrid: React.FC<{ photos: Photo[]; settings: SceneSettings }> = ({ photos, settings }) => {
  const positions = useMemo(() => {
    const gridSize = Math.ceil(Math.sqrt(Math.max(photos.length, 9))); // At least 3x3 grid
    const spacing = 4;
    const offset = (gridSize - 1) * spacing / 2;
    
    const positions: [number, number, number][] = [];
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = i * spacing - offset;
        const z = j * spacing - offset;
        const y = Math.sin(i * 0.5) * Math.cos(j * 0.5) * 2; // Slight wave effect
        positions.push([x, y, z]);
      }
    }
    
    return positions;
  }, [photos.length]);

  return (
    <group>
      {positions.map((position, index) => {
        const photo = photos[index];
        if (photo) {
          return (
            <SimplePhoto
              key={photo.id}
              position={position}
              photoUrl={photo.url}
            />
          );
        } else {
          // Show placeholder for empty slots if we have fewer photos than positions
          return (
            <PlaceholderPhoto
              key={`placeholder-${index}`}
              position={position}
            />
          );
        }
      })}
    </group>
  );
};

// Loading fallback
const SceneFallback: React.FC = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666666" />
    </mesh>
  );
};

// Main CollageScene component
const CollageScene: React.FC<CollageSceneProps> = ({ photos = [], settings = {} }) => {
  console.log('🎬 CollageScene render:', { photoCount: photos.length, hasSettings: !!settings });
  
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  
  // Create background style
  const backgroundStyle = useMemo(() => {
    if (mergedSettings.backgroundGradient) {
      return {
        background: `linear-gradient(${mergedSettings.backgroundGradientAngle}deg, ${mergedSettings.backgroundGradientStart}, ${mergedSettings.backgroundGradientEnd})`
      };
    }
    return {
      background: mergedSettings.backgroundColor
    };
  }, [mergedSettings]);

  return (
    <div style={backgroundStyle} className="w-full h-full">
      <Canvas
        shadows={mergedSettings.shadowsEnabled}
        camera={{ 
          position: [15, 5, 15], 
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onCreated={(state) => {
          state.gl.shadowMap.enabled = mergedSettings.shadowsEnabled || true;
          state.gl.shadowMap.type = THREE.PCFSoftShadowMap;
          state.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          
          // Set clear color
          state.gl.setClearColor(mergedSettings.backgroundColor || '#1a1a1a');
        }}
      >
        <Suspense fallback={<SceneFallback />}>
          {/* Essential lighting - this ensures the scene is never black */}
          <SceneLighting settings={mergedSettings} />
          
          {/* Camera controls */}
          <CameraController settings={mergedSettings} />
          
          {/* Floor */}
          <Floor settings={mergedSettings} />
          
          {/* Photos or placeholder content */}
          {photos.length > 0 ? (
            <PhotoGrid photos={photos} settings={mergedSettings} />
          ) : (
            // Show some placeholder content when no photos
            <group>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial color="#666666" />
              </mesh>
              <mesh position={[4, 0, 0]}>
                <sphereGeometry args={[1, 16, 16]} />
                <meshStandardMaterial color="#888888" />
              </mesh>
              <mesh position={[-4, 0, 0]}>
                <coneGeometry args={[1, 2, 8]} />
                <meshStandardMaterial color="#aaaaaa" />
              </mesh>
            </group>
          )}
          
          {/* Helper grid for debugging */}
          {mergedSettings.showGrid && (
            <gridHelper args={[20, 20, '#444444', '#444444']} position={[0, -9.9, 0]} />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default CollageScene;