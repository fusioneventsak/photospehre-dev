import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Particle color themes - matching the hero section
export const PARTICLE_THEMES = [
  { name: 'Purple Magic', primary: '#8b5cf6', secondary: '#a855f7', accent: '#c084fc' },
  { name: 'Ocean Breeze', primary: '#06b6d4', secondary: '#0891b2', accent: '#67e8f9' },
  { name: 'Sunset Glow', primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
  { name: 'Forest Dream', primary: '#10b981', secondary: '#059669', accent: '#34d399' },
  { name: 'Rose Petals', primary: '#ec4899', secondary: '#db2777', accent: '#f9a8d4' },
  { name: 'Electric Blue', primary: '#3b82f6', secondary: '#2563eb', accent: '#93c5fd' },
  { name: 'Cosmic Red', primary: '#ef4444', secondary: '#dc2626', accent: '#fca5a5' },
  { name: 'Disabled', primary: '#000000', secondary: '#000000', accent: '#000000' }
];

interface MilkyWayParticleSystemProps {
  colorTheme: typeof PARTICLE_THEMES[0];
  intensity?: number; // 0-1 to control particle density
  enabled?: boolean; // Toggle particles on/off
  photoPositions?: Array<{ position: [number, number, number] }>; // Optional photo positions for dust concentration
}

const MilkyWayParticleSystem: React.FC<MilkyWayParticleSystemProps> = ({ 
  colorTheme, 
  intensity = 1.0, 
  enabled = true,
  photoPositions = []
}) => {
  const mainCloudRef = useRef<THREE.Points>(null);
  const dustCloudRef = useRef<THREE.Points>(null);
  const clustersRef = useRef<THREE.Group>(null);
  // NEW: Additional refs for atmospheric and distant particles
  const atmosphericRef = useRef<THREE.Points>(null);
  const distantSwirlRef = useRef<THREE.Points>(null);
  const bigSwirlsRef = useRef<THREE.Group>(null);
  
  // Adjust particle counts based on intensity
  const MAIN_COUNT = Math.floor(4000 * intensity);
  const DUST_COUNT = Math.floor(2500 * intensity);
  const CLUSTER_COUNT = Math.floor(8 * intensity);
  const PARTICLES_PER_CLUSTER = 300;
  // NEW: Additional atmospheric and distant particles
  const ATMOSPHERIC_COUNT = Math.floor(3000 * intensity);
  const DISTANT_SWIRL_COUNT = Math.floor(1500 * intensity);
  const BIG_SWIRLS_COUNT = Math.floor(4 * intensity);
  
  // Create realistic particle distribution
  const particleData = useMemo(() => {
    if (!enabled || intensity === 0) {
      return {
        main: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), count: 0 },
        dust: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), count: 0 },
        clusters: [],
        atmospheric: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), count: 0 },
        distantSwirl: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), count: 0 },
        bigSwirls: []
      };
    }

    // Main cloud particles (distributed in a galaxy-like spiral) - LOWERED
    const mainPositions = new Float32Array(MAIN_COUNT * 3);
    const mainColors = new Float32Array(MAIN_COUNT * 3);
    const mainSizes = new Float32Array(MAIN_COUNT);
    const mainVelocities = new Float32Array(MAIN_COUNT * 3);
    
    for (let i = 0; i < MAIN_COUNT; i++) {
      // Create multiple spiral arms like the Milky Way
      const armIndex = Math.floor(Math.random() * 4);
      const armAngle = (armIndex * Math.PI / 2) + (Math.random() - 0.5) * 0.5;
      const distanceFromCenter = Math.pow(Math.random(), 0.5) * 80;
      const spiralTightness = 0.2;
      const angle = armAngle + (distanceFromCenter * spiralTightness);
      
      const noise = (Math.random() - 0.5) * (8 + distanceFromCenter * 0.1);
      // REDUCED height variation and lowered overall Y position
      const heightNoise = (Math.random() - 0.5) * (1 + distanceFromCenter * 0.02);
      
      mainPositions[i * 3] = Math.cos(angle) * distanceFromCenter + noise;
      // LOWERED: Changed from heightNoise + Math.sin(...) * (...) to much lower values
      mainPositions[i * 3 + 1] = heightNoise + Math.sin(angle * 0.1) * (distanceFromCenter * 0.01) - 5;
      mainPositions[i * 3 + 2] = Math.sin(angle) * distanceFromCenter + noise;
      
      mainVelocities[i * 3] = (Math.random() - 0.5) * 0.002;
      mainVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0005; // Reduced Y velocity
      mainVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
      
      const sizeRandom = Math.random();
      if (sizeRandom < 0.7) {
        mainSizes[i] = 0.5 + Math.random() * 1.5;
      } else if (sizeRandom < 0.9) {
        mainSizes[i] = 2 + Math.random() * 2;
      } else {
        mainSizes[i] = 4 + Math.random() * 3;
      }
    }
    
    // Dust cloud particles - LOWERED
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    const dustColors = new Float32Array(DUST_COUNT * 3);
    const dustSizes = new Float32Array(DUST_COUNT);
    const dustVelocities = new Float32Array(DUST_COUNT * 3);
    
    for (let i = 0; i < DUST_COUNT; i++) {
      const radius = Math.pow(Math.random(), 2) * 50 + 10;
      const angle = Math.random() * Math.PI * 2;
      // LOWERED: Changed height range from 30 to 10, and base from 15 to -5
      const height = (Math.random() - 0.5) * 10 - 5;
      
      dustPositions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 15;
      dustPositions[i * 3 + 1] = height;
      dustPositions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 15;
      
      dustVelocities[i * 3] = (Math.random() - 0.5) * 0.003;
      dustVelocities[i * 3 + 1] = Math.random() * 0.001 + 0.0005; // Reduced upward velocity
      dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
      
      dustSizes[i] = 0.3 + Math.random() * 1.2;
    }
    
    // Create star clusters - LOWERED
    const clusterData = [];
    for (let c = 0; c < CLUSTER_COUNT; c++) {
      const clusterDistance = 30 + Math.random() * 100;
      const clusterAngle = Math.random() * Math.PI * 2;
      // LOWERED: Changed height range from 60 to 20, and base from 20 to -10
      const clusterHeight = (Math.random() - 0.5) * 20 - 10;
      
      const clusterCenter = {
        x: Math.cos(clusterAngle) * clusterDistance,
        y: clusterHeight,
        z: Math.sin(clusterAngle) * clusterDistance
      };
      
      const clusterPositions = new Float32Array(PARTICLES_PER_CLUSTER * 3);
      const clusterColors = new Float32Array(PARTICLES_PER_CLUSTER * 3);
      const clusterSizes = new Float32Array(PARTICLES_PER_CLUSTER);
      const clusterVelocities = new Float32Array(PARTICLES_PER_CLUSTER * 3);
      
      for (let i = 0; i < PARTICLES_PER_CLUSTER; i++) {
        const phi = Math.random() * Math.PI * 2;
        const cosTheta = Math.random() * 2 - 1;
        const u = Math.random();
        const clusterRadius = Math.pow(u, 1/3) * (3 + Math.random() * 4);
        
        const theta = Math.acos(cosTheta);
        const r = clusterRadius;
        
        clusterPositions[i * 3] = clusterCenter.x + r * Math.sin(theta) * Math.cos(phi);
        clusterPositions[i * 3 + 1] = clusterCenter.y + r * Math.cos(theta);
        clusterPositions[i * 3 + 2] = clusterCenter.z + r * Math.sin(theta) * Math.sin(phi);
        
        clusterVelocities[i * 3] = (Math.random() - 0.5) * 0.001;
        clusterVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0005; // Reduced Y velocity
        clusterVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
        
        clusterSizes[i] = 0.8 + Math.random() * 2.5;
      }
      
      clusterData.push({
        positions: clusterPositions,
        colors: clusterColors,
        sizes: clusterSizes,
        velocities: clusterVelocities,
        center: clusterCenter
      });
    }
    
    // NEW: Atmospheric particles (floating through the scene at various heights)
    const atmosphericPositions = new Float32Array(ATMOSPHERIC_COUNT * 3);
    const atmosphericColors = new Float32Array(ATMOSPHERIC_COUNT * 3);
    const atmosphericSizes = new Float32Array(ATMOSPHERIC_COUNT);
    const atmosphericVelocities = new Float32Array(ATMOSPHERIC_COUNT * 3);
    
    for (let i = 0; i < ATMOSPHERIC_COUNT; i++) {
      // Spread throughout the entire scene volume
      atmosphericPositions[i * 3] = (Math.random() - 0.5) * 200;
      atmosphericPositions[i * 3 + 1] = Math.random() * 80 + 5; // From 5 to 85 height
      atmosphericPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      
      atmosphericVelocities[i * 3] = (Math.random() - 0.5) * 0.001;
      atmosphericVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0008;
      atmosphericVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
      
      // Varied sizes for atmospheric depth
      const sizeRandom = Math.random();
      if (sizeRandom < 0.6) {
        atmosphericSizes[i] = 0.2 + Math.random() * 0.8;
      } else if (sizeRandom < 0.85) {
        atmosphericSizes[i] = 1 + Math.random() * 1.5;
      } else {
        atmosphericSizes[i] = 2.5 + Math.random() * 2;
      }
    }
    
    // NEW: Distant swirl particles (large spiral formations in the background)
    const distantSwirlPositions = new Float32Array(DISTANT_SWIRL_COUNT * 3);
    const distantSwirlColors = new Float32Array(DISTANT_SWIRL_COUNT * 3);
    const distantSwirlSizes = new Float32Array(DISTANT_SWIRL_COUNT);
    const distantSwirlVelocities = new Float32Array(DISTANT_SWIRL_COUNT * 3);
    
    for (let i = 0; i < DISTANT_SWIRL_COUNT; i++) {
      // Create large distant spiral
      const swirlArm = Math.floor(Math.random() * 6); // 6 spiral arms
      const armAngle = (swirlArm * Math.PI / 3) + (Math.random() - 0.5) * 0.3;
      const distanceFromCenter = Math.pow(Math.random(), 0.3) * 150 + 80; // Further out
      const spiralTightness = 0.15;
      const angle = armAngle + (distanceFromCenter * spiralTightness);
      
      const noise = (Math.random() - 0.5) * 20;
      const heightVariation = (Math.random() - 0.5) * 40 + 30; // Higher up
      
      distantSwirlPositions[i * 3] = Math.cos(angle) * distanceFromCenter + noise;
      distantSwirlPositions[i * 3 + 1] = heightVariation + Math.sin(angle * 0.05) * 15;
      distantSwirlPositions[i * 3 + 2] = Math.sin(angle) * distanceFromCenter + noise;
      
      distantSwirlVelocities[i * 3] = (Math.random() - 0.5) * 0.0008;
      distantSwirlVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0005;
      distantSwirlVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0008;
      
      // Larger particles for distant effect
      distantSwirlSizes[i] = 1.5 + Math.random() * 3.5;
    }
    
    // NEW: Big swirl formations (massive spiral structures)
    const bigSwirlData = [];
    for (let s = 0; s < BIG_SWIRLS_COUNT; s++) {
      const swirlDistance = 120 + Math.random() * 100;
      const swirlAngle = Math.random() * Math.PI * 2;
      const swirlHeight = 40 + Math.random() * 60;
      const particlesPerSwirl = 800;
      
      const swirlCenter = {
        x: Math.cos(swirlAngle) * swirlDistance,
        y: swirlHeight,
        z: Math.sin(swirlAngle) * swirlDistance
      };
      
      const swirlPositions = new Float32Array(particlesPerSwirl * 3);
      const swirlColors = new Float32Array(particlesPerSwirl * 3);
      const swirlSizes = new Float32Array(particlesPerSwirl);
      const swirlVelocities = new Float32Array(particlesPerSwirl * 3);
      
      for (let i = 0; i < particlesPerSwirl; i++) {
        // Create spiral pattern
        const spiralRadius = Math.pow(Math.random(), 0.4) * 30;
        const spiralAngle = Math.random() * Math.PI * 4 + (spiralRadius * 0.3);
        const spiralHeight = (Math.random() - 0.5) * 25;
        
        swirlPositions[i * 3] = swirlCenter.x + Math.cos(spiralAngle) * spiralRadius;
        swirlPositions[i * 3 + 1] = swirlCenter.y + spiralHeight;
        swirlPositions[i * 3 + 2] = swirlCenter.z + Math.sin(spiralAngle) * spiralRadius;
        
        swirlVelocities[i * 3] = (Math.random() - 0.5) * 0.0005;
        swirlVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0003;
        swirlVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0005;
        
        swirlSizes[i] = 1.2 + Math.random() * 4;
      }
      
      bigSwirlData.push({
        positions: swirlPositions,
        colors: swirlColors,
        sizes: swirlSizes,
        velocities: swirlVelocities,
        center: swirlCenter
      });
    }
    
    return {
      main: {
        positions: mainPositions,
        colors: mainColors,
        sizes: mainSizes,
        velocities: mainVelocities,
        count: MAIN_COUNT
      },
      dust: {
        positions: dustPositions,
        colors: dustColors,
        sizes: dustSizes,
        velocities: dustVelocities,
        count: DUST_COUNT
      },
      clusters: clusterData,
      atmospheric: {
        positions: atmosphericPositions,
        colors: atmosphericColors,
        sizes: atmosphericSizes,
        velocities: atmosphericVelocities,
        count: ATMOSPHERIC_COUNT
      },
      distantSwirl: {
        positions: distantSwirlPositions,
        colors: distantSwirlColors,
        sizes: distantSwirlSizes,
        velocities: distantSwirlVelocities,
        count: DISTANT_SWIRL_COUNT
      },
      bigSwirls: bigSwirlData
    };
  }, [intensity, enabled, MAIN_COUNT, DUST_COUNT, CLUSTER_COUNT, ATMOSPHERIC_COUNT, DISTANT_SWIRL_COUNT, BIG_SWIRLS_COUNT]);

  // Update colors when theme changes
  React.useEffect(() => {
    if (!enabled || !mainCloudRef.current || !dustCloudRef.current || !clustersRef.current || 
        !atmosphericRef.current || !distantSwirlRef.current || !bigSwirlsRef.current) return;
    
    // Update main cloud colors
    if (particleData.main.count > 0) {
      const mainColors = mainCloudRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.main.count; i++) {
        const baseColor = new THREE.Color(colorTheme.primary);
        const hsl = { h: 0, s: 0, l: 0 };
        baseColor.getHSL(hsl);
        
        const hueVariation = (Math.random() - 0.5) * 0.1;
        const saturationVariation = 0.8 + Math.random() * 0.4;
        const lightnessVariation = 0.3 + Math.random() * 0.7;
        
        const particleColor = new THREE.Color();
        particleColor.setHSL(
          (hsl.h + hueVariation + 1) % 1,
          Math.min(1, hsl.s * saturationVariation),
          Math.min(1, hsl.l * lightnessVariation)
        );
        
        mainColors[i * 3] = particleColor.r;
        mainColors[i * 3 + 1] = particleColor.g;
        mainColors[i * 3 + 2] = particleColor.b;
      }
      mainCloudRef.current.geometry.attributes.color.needsUpdate = true;
    }
    
    // Update dust cloud colors
    if (particleData.dust.count > 0) {
      const dustColors = dustCloudRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.dust.count; i++) {
        const baseColor = new THREE.Color(colorTheme.secondary);
        const hsl = { h: 0, s: 0, l: 0 };
        baseColor.getHSL(hsl);
        
        const particleColor = new THREE.Color();
        particleColor.setHSL(
          (hsl.h + (Math.random() - 0.5) * 0.15 + 1) % 1,
          Math.min(1, hsl.s * (0.5 + Math.random() * 0.5)),
          Math.min(1, hsl.l * (0.4 + Math.random() * 0.6))
        );
        
        dustColors[i * 3] = particleColor.r;
        dustColors[i * 3 + 1] = particleColor.g;
        dustColors[i * 3 + 2] = particleColor.b;
      }
      dustCloudRef.current.geometry.attributes.color.needsUpdate = true;
    }
    
    // Update cluster colors
    clustersRef.current.children.forEach((cluster, clusterIndex) => {
      if (cluster instanceof THREE.Points && clusterIndex < particleData.clusters.length) {
        const clusterColors = cluster.geometry.attributes.color.array as Float32Array;
        const clusterColorBase = [colorTheme.primary, colorTheme.secondary, colorTheme.accent][clusterIndex % 3];
        
        for (let i = 0; i < PARTICLES_PER_CLUSTER; i++) {
          const baseColor = new THREE.Color(clusterColorBase);
          const hsl = { h: 0, s: 0, l: 0 };
          baseColor.getHSL(hsl);
          
          const particleColor = new THREE.Color();
          particleColor.setHSL(
            (hsl.h + (Math.random() - 0.5) * 0.08 + 1) % 1,
            Math.min(1, hsl.s * (0.7 + Math.random() * 0.6)),
            Math.min(1, hsl.l * (0.5 + Math.random() * 0.5))
          );
          
          clusterColors[i * 3] = particleColor.r;
          clusterColors[i * 3 + 1] = particleColor.g;
          clusterColors[i * 3 + 2] = particleColor.b;
        }
        cluster.geometry.attributes.color.needsUpdate = true;
      }
    });
    
    // NEW: Update atmospheric colors
    if (particleData.atmospheric.count > 0) {
      const atmosphericColors = atmosphericRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.atmospheric.count; i++) {
        const baseColor = new THREE.Color(colorTheme.accent);
        const hsl = { h: 0, s: 0, l: 0 };
        baseColor.getHSL(hsl);
        
        const particleColor = new THREE.Color();
        particleColor.setHSL(
          (hsl.h + (Math.random() - 0.5) * 0.2 + 1) % 1,
          Math.min(1, hsl.s * (0.3 + Math.random() * 0.4)),
          Math.min(1, hsl.l * (0.2 + Math.random() * 0.5))
        );
        
        atmosphericColors[i * 3] = particleColor.r;
        atmosphericColors[i * 3 + 1] = particleColor.g;
        atmosphericColors[i * 3 + 2] = particleColor.b;
      }
      atmosphericRef.current.geometry.attributes.color.needsUpdate = true;
    }
    
    // NEW: Update distant swirl colors
    if (particleData.distantSwirl.count > 0) {
      const distantColors = distantSwirlRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.distantSwirl.count; i++) {
        const baseColor = new THREE.Color(colorTheme.primary);
        const hsl = { h: 0, s: 0, l: 0 };
        baseColor.getHSL(hsl);
        
        const particleColor = new THREE.Color();
        particleColor.setHSL(
          (hsl.h + (Math.random() - 0.5) * 0.1 + 1) % 1,
          Math.min(1, hsl.s * (0.6 + Math.random() * 0.4)),
          Math.min(1, hsl.l * (0.4 + Math.random() * 0.4))
        );
        
        distantColors[i * 3] = particleColor.r;
        distantColors[i * 3 + 1] = particleColor.g;
        distantColors[i * 3 + 2] = particleColor.b;
      }
      distantSwirlRef.current.geometry.attributes.color.needsUpdate = true;
    }
    
    // NEW: Update big swirl colors
    bigSwirlsRef.current.children.forEach((swirl, swirlIndex) => {
      if (swirl instanceof THREE.Points && swirlIndex < particleData.bigSwirls.length) {
        const swirlColors = swirl.geometry.attributes.color.array as Float32Array;
        const swirlColorBase = [colorTheme.primary, colorTheme.secondary, colorTheme.accent][swirlIndex % 3];
        
        for (let i = 0; i < 800; i++) { // particlesPerSwirl
          const baseColor = new THREE.Color(swirlColorBase);
          const hsl = { h: 0, s: 0, l: 0 };
          baseColor.getHSL(hsl);
          
          const particleColor = new THREE.Color();
          particleColor.setHSL(
            (hsl.h + (Math.random() - 0.5) * 0.15 + 1) % 1,
            Math.min(1, hsl.s * (0.5 + Math.random() * 0.5)),
            Math.min(1, hsl.l * (0.3 + Math.random() * 0.4))
          );
          
          swirlColors[i * 3] = particleColor.r;
          swirlColors[i * 3 + 1] = particleColor.g;
          swirlColors[i * 3 + 2] = particleColor.b;
        }
        swirl.geometry.attributes.color.needsUpdate = true;
      }
    });
  }, [colorTheme, particleData, enabled]);

  // Animation system
  useFrame((state) => {
    if (!enabled) return;
    
    const time = state.clock.getElapsedTime();
    
    // Animate main cloud
    if (mainCloudRef.current && particleData.main.count > 0) {
      const mainPositions = mainCloudRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleData.main.count; i++) {
        const i3 = i * 3;
        
        mainPositions[i3] += particleData.main.velocities[i3];
        mainPositions[i3 + 1] += particleData.main.velocities[i3 + 1];
        mainPositions[i3 + 2] += particleData.main.velocities[i3 + 2];
        
        const x = mainPositions[i3];
        const z = mainPositions[i3 + 2];
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        
        const orbitalSpeed = distanceFromCenter > 0 ? 0.00008 / Math.sqrt(distanceFromCenter + 10) : 0;
        const angle = Math.atan2(z, x);
        const newAngle = angle + orbitalSpeed;
        
        mainPositions[i3] += Math.cos(newAngle) * orbitalSpeed * 0.1;
        mainPositions[i3 + 2] += Math.sin(newAngle) * orbitalSpeed * 0.1;
        
        const parallaxFreq = time * 0.02 + i * 0.001;
        mainPositions[i3] += Math.sin(parallaxFreq) * 0.002; // INCREASED horizontal movement
        // INCREASED Y movement amplitude for more noticeable hover
        mainPositions[i3 + 1] += Math.cos(parallaxFreq * 0.7) * 0.0008;
        mainPositions[i3 + 2] += Math.sin(parallaxFreq * 1.3) * 0.002; // INCREASED depth movement
        
        // NEW: Add gentle bobbing motion - individual particle hover
        const bobFreq = time * 0.5 + i * 0.1;
        mainPositions[i3 + 1] += Math.sin(bobFreq) * 0.003; // Gentle up-down bobbing
      }
      
      mainCloudRef.current.geometry.attributes.position.needsUpdate = true;
      mainCloudRef.current.rotation.y = time * 0.003;
    }
    
    // Animate dust cloud
    if (dustCloudRef.current && particleData.dust.count > 0) {
      const dustPositions = dustCloudRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleData.dust.count; i++) {
        const i3 = i * 3;
        
        dustPositions[i3] += particleData.dust.velocities[i3];
        dustPositions[i3 + 1] += particleData.dust.velocities[i3 + 1];
        dustPositions[i3 + 2] += particleData.dust.velocities[i3 + 2];
        
        const turbulenceFreq = time * 0.1 + i * 0.05;
        dustPositions[i3] += Math.sin(turbulenceFreq) * 0.003; // INCREASED horizontal movement
        // INCREASED Y turbulence for more hover effect
        dustPositions[i3 + 1] += Math.cos(turbulenceFreq * 1.3) * 0.002;
        dustPositions[i3 + 2] += Math.sin(turbulenceFreq * 0.8) * 0.003; // INCREASED depth movement
        
        // NEW: Add dust-specific floating motion
        const dustFloatFreq = time * 0.3 + i * 0.08;
        dustPositions[i3] += Math.cos(dustFloatFreq) * 0.001; // Gentle side-to-side drift
        dustPositions[i3 + 1] += Math.sin(dustFloatFreq * 0.6) * 0.002; // Floating up and down
        
        // LOWERED recycling boundaries
        if (dustPositions[i3 + 1] > 15) {
          dustPositions[i3 + 1] = -15;
          dustPositions[i3] = (Math.random() - 0.5) * 70;
          dustPositions[i3 + 2] = (Math.random() - 0.5) * 70;
        }
        
        if (Math.abs(dustPositions[i3]) > 80) {
          dustPositions[i3] = -Math.sign(dustPositions[i3]) * 20;
        }
        if (Math.abs(dustPositions[i3 + 2]) > 80) {
          dustPositions[i3 + 2] = -Math.sign(dustPositions[i3 + 2]) * 20;
        }
      }
      
      dustCloudRef.current.geometry.attributes.position.needsUpdate = true;
      dustCloudRef.current.rotation.y = time * 0.005;
    }
    
    // Animate clusters
    if (clustersRef.current) {
      clustersRef.current.children.forEach((cluster, clusterIndex) => {
        if (cluster instanceof THREE.Points && clusterIndex < particleData.clusters.length) {
          const positions = cluster.geometry.attributes.position.array as Float32Array;
          const velocities = particleData.clusters[clusterIndex].velocities;
          const expectedLength = PARTICLES_PER_CLUSTER * 3;
          const clusterCenter = particleData.clusters[clusterIndex].center;
          
          if (positions.length === expectedLength && velocities.length === expectedLength) {
            for (let i = 0; i < PARTICLES_PER_CLUSTER; i++) {
              const i3 = i * 3;
              
              positions[i3] += velocities[i3];
              positions[i3 + 1] += velocities[i3 + 1];
              positions[i3 + 2] += velocities[i3 + 2];
              
              const dx = clusterCenter.x - positions[i3];
              const dy = clusterCenter.y - positions[i3 + 1];
              const dz = clusterCenter.z - positions[i3 + 2];
              const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
              
              if (distance > 0) {
                const gravitationalForce = 0.00001;
                positions[i3] += (dx / distance) * gravitationalForce;
                positions[i3 + 1] += (dy / distance) * gravitationalForce;
                positions[i3 + 2] += (dz / distance) * gravitationalForce;
              }
              
              const clusterWave = time * 0.03 + clusterIndex + i * 0.1;
              positions[i3] += Math.sin(clusterWave) * 0.001; // INCREASED horizontal movement
              // INCREASED Y wave amplitude for more hover
              positions[i3 + 1] += Math.cos(clusterWave * 0.8) * 0.0008;
              positions[i3 + 2] += Math.sin(clusterWave * 1.2) * 0.001; // INCREASED depth movement
              
              // NEW: Add cluster-specific gentle floating
              const clusterFloatFreq = time * 0.4 + clusterIndex * 2 + i * 0.05;
              positions[i3 + 1] += Math.sin(clusterFloatFreq) * 0.002; // Individual particle hover within cluster
            }
            
            cluster.geometry.attributes.position.needsUpdate = true;
            cluster.rotation.x = time * 0.001 * (clusterIndex % 2 ? 1 : -1);
            cluster.rotation.z = time * 0.0015 * (clusterIndex % 3 ? 1 : -1);
          }
        }
      });
    }
    
    // NEW: Animate atmospheric particles
    if (atmosphericRef.current && particleData.atmospheric.count > 0) {
      const atmosphericPositions = atmosphericRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleData.atmospheric.count; i++) {
        const i3 = i * 3;
        
        atmosphericPositions[i3] += particleData.atmospheric.velocities[i3];
        atmosphericPositions[i3 + 1] += particleData.atmospheric.velocities[i3 + 1];
        atmosphericPositions[i3 + 2] += particleData.atmospheric.velocities[i3 + 2];
        
        // Gentle floating motion
        const floatFreq = time * 0.05 + i * 0.02;
        atmosphericPositions[i3] += Math.sin(floatFreq) * 0.002; // INCREASED horizontal drift
        atmosphericPositions[i3 + 1] += Math.cos(floatFreq * 0.7) * 0.003; // INCREASED vertical float
        atmosphericPositions[i3 + 2] += Math.sin(floatFreq * 1.1) * 0.002; // INCREASED depth movement
        
        // NEW: Add secondary layer of gentle bobbing for atmospheric particles
        const atmosphericBobFreq = time * 0.8 + i * 0.15;
        atmosphericPositions[i3 + 1] += Math.sin(atmosphericBobFreq) * 0.001; // Extra gentle bobbing
        
        // Boundary wrapping
        if (Math.abs(atmosphericPositions[i3]) > 120) {
          atmosphericPositions[i3] = -Math.sign(atmosphericPositions[i3]) * 50;
        }
        if (atmosphericPositions[i3 + 1] > 90) {
          atmosphericPositions[i3 + 1] = 5;
        }
        if (atmosphericPositions[i3 + 1] < -5) {
          atmosphericPositions[i3 + 1] = 85;
        }
        if (Math.abs(atmosphericPositions[i3 + 2]) > 120) {
          atmosphericPositions[i3 + 2] = -Math.sign(atmosphericPositions[i3 + 2]) * 50;
        }
      }
      
      atmosphericRef.current.geometry.attributes.position.needsUpdate = true;
      atmosphericRef.current.rotation.y = time * 0.001;
    }
    
    // NEW: Animate distant swirl
    if (distantSwirlRef.current && particleData.distantSwirl.count > 0) {
      const distantPositions = distantSwirlRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleData.distantSwirl.count; i++) {
        const i3 = i * 3;
        
        distantPositions[i3] += particleData.distantSwirl.velocities[i3];
        distantPositions[i3 + 1] += particleData.distantSwirl.velocities[i3 + 1];
        distantPositions[i3 + 2] += particleData.distantSwirl.velocities[i3 + 2];
        
        // Large scale orbital motion
        const x = distantPositions[i3];
        const z = distantPositions[i3 + 2];
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        
        const orbitalSpeed = distanceFromCenter > 0 ? 0.00005 / Math.sqrt(distanceFromCenter + 20) : 0;
        const angle = Math.atan2(z, x);
        const newAngle = angle + orbitalSpeed;
        
        distantPositions[i3] += Math.cos(newAngle) * orbitalSpeed * 0.05;
        distantPositions[i3 + 2] += Math.sin(newAngle) * orbitalSpeed * 0.05;
        
        // Slow undulation
        const waveFreq = time * 0.01 + i * 0.001;
        distantPositions[i3 + 1] += Math.sin(waveFreq) * 0.005; // INCREASED undulation amplitude
        
        // NEW: Add distant particle gentle drift
        const distantDriftFreq = time * 0.02 + i * 0.003;
        distantPositions[i3] += Math.cos(distantDriftFreq) * 0.001; // Gentle horizontal drift
        distantPositions[i3 + 2] += Math.sin(distantDriftFreq * 1.3) * 0.001; // Gentle depth drift
      }
      
      distantSwirlRef.current.geometry.attributes.position.needsUpdate = true;
      distantSwirlRef.current.rotation.y = time * 0.002;
    }
    
    // NEW: Animate big swirls
    if (bigSwirlsRef.current) {
      bigSwirlsRef.current.children.forEach((swirl, swirlIndex) => {
        if (swirl instanceof THREE.Points && swirlIndex < particleData.bigSwirls.length) {
          const positions = swirl.geometry.attributes.position.array as Float32Array;
          const velocities = particleData.bigSwirls[swirlIndex].velocities;
          const swirlCenter = particleData.bigSwirls[swirlIndex].center;
          
          for (let i = 0; i < 800; i++) { // particlesPerSwirl
            const i3 = i * 3;
            
            positions[i3] += velocities[i3];
            positions[i3 + 1] += velocities[i3 + 1];
            positions[i3 + 2] += velocities[i3 + 2];
            
            // Spiral motion around center
            const dx = positions[i3] - swirlCenter.x;
            const dz = positions[i3 + 2] - swirlCenter.z;
            const radius = Math.sqrt(dx * dx + dz * dz);
            
            if (radius > 0.1) {
              const swirlSpeed = 0.0002;
              const currentAngle = Math.atan2(dz, dx);
              const newAngle = currentAngle + swirlSpeed;
              
              positions[i3] = swirlCenter.x + Math.cos(newAngle) * radius;
              positions[i3 + 2] = swirlCenter.z + Math.sin(newAngle) * radius;
            }
            
            // Vertical oscillation
            const oscillation = time * 0.02 + swirlIndex + i * 0.01;
            positions[i3 + 1] += Math.sin(oscillation) * 0.003; // INCREASED oscillation amplitude
            
            // NEW: Add big swirl gentle movement
            const bigSwirlFloatFreq = time * 0.06 + swirlIndex * 3 + i * 0.02;
            positions[i3] += Math.cos(bigSwirlFloatFreq) * 0.0008; // Gentle horizontal drift
            positions[i3 + 2] += Math.sin(bigSwirlFloatFreq * 0.9) * 0.0008; // Gentle depth drift
          }
          
          swirl.geometry.attributes.position.needsUpdate = true;
          swirl.rotation.y = time * 0.003 * (swirlIndex % 2 ? 1 : -1);
        }
      });
    }
  });

  if (!enabled || intensity === 0) {
    return null;
  }

  // Create a key that changes when the particle counts change
  const particleKey = `particles-${enabled ? 1 : 0}-${intensity.toFixed(1)}`;

  return (
    <group key={particleKey}>
      {/* Main Milky Way Cloud */}
      <points ref={mainCloudRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.main.positions}
            count={particleData.main.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.main.colors}
            count={particleData.main.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.main.sizes}
            count={particleData.main.count}
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
            varying float vOpacity;
            void main() {
              vColor = color;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              
              float distance = length(mvPosition.xyz);
              vOpacity = 1.0 - smoothstep(50.0, 200.0, distance);
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vOpacity;
            void main() {
              float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
              if (distanceToCenter > 0.5) discard;
              
              float alpha = 1.0 - (distanceToCenter * 2.0);
              alpha = smoothstep(0.0, 1.0, alpha);
              
              gl_FragColor = vec4(vColor, alpha * vOpacity * 0.8);
            }
          `}
        />
      </points>
      
      {/* Cosmic dust cloud */}
      <points ref={dustCloudRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.dust.positions}
            count={particleData.dust.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.dust.colors}
            count={particleData.dust.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.dust.sizes}
            count={particleData.dust.count}
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
            varying float vOpacity;
            void main() {
              vColor = color;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (200.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              
              float distance = length(mvPosition.xyz);
              vOpacity = 1.0 - smoothstep(30.0, 100.0, distance);
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vOpacity;
            void main() {
              float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
              if (distanceToCenter > 0.5) discard;
              
              float alpha = 1.0 - (distanceToCenter * 2.0);
              alpha = smoothstep(0.0, 1.0, alpha);
              
              gl_FragColor = vec4(vColor, alpha * vOpacity * 0.6);
            }
          `}
        />
      </points>
      
      {/* Star clusters */}
      <group ref={clustersRef}>
        {particleData.clusters.map((cluster, index) => (
          <points key={`${particleKey}-cluster-${index}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={cluster.positions}
                count={PARTICLES_PER_CLUSTER}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-color"
                array={cluster.colors}
                count={PARTICLES_PER_CLUSTER}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-size"
                array={cluster.sizes}
                count={PARTICLES_PER_CLUSTER}
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
                varying float vOpacity;
                void main() {
                  vColor = color;
                  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                  gl_PointSize = size * (250.0 / -mvPosition.z);
                  gl_Position = projectionMatrix * mvPosition;
                  
                  float distance = length(mvPosition.xyz);
                  vOpacity = 1.0 - smoothstep(80.0, 300.0, distance);
                }
              `}
              fragmentShader={`
                varying vec3 vColor;
                varying float vOpacity;
                void main() {
                  float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                  if (distanceToCenter > 0.5) discard;
                  
                  float alpha = 1.0 - (distanceToCenter * 2.0);
                  alpha = smoothstep(0.0, 1.0, alpha);
                  
                  gl_FragColor = vec4(vColor, alpha * vOpacity * 0.9);
                }
              `}
            />
          </points>
        ))}
      </group>
      
      {/* NEW: Atmospheric particles */}
      <points ref={atmosphericRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.atmospheric.positions}
            count={particleData.atmospheric.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.atmospheric.colors}
            count={particleData.atmospheric.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.atmospheric.sizes}
            count={particleData.atmospheric.count}
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
            varying float vOpacity;
            void main() {
              vColor = color;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (150.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              
              float distance = length(mvPosition.xyz);
              vOpacity = 1.0 - smoothstep(100.0, 400.0, distance);
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vOpacity;
            void main() {
              float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
              if (distanceToCenter > 0.5) discard;
              
              float alpha = 1.0 - (distanceToCenter * 2.0);
              alpha = smoothstep(0.0, 1.0, alpha);
              
              gl_FragColor = vec4(vColor, alpha * vOpacity * 0.3);
            }
          `}
        />
      </points>
      
      {/* NEW: Distant swirl particles */}
      <points ref={distantSwirlRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.distantSwirl.positions}
            count={particleData.distantSwirl.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.distantSwirl.colors}
            count={particleData.distantSwirl.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.distantSwirl.sizes}
            count={particleData.distantSwirl.count}
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
            varying float vOpacity;
            void main() {
              vColor = color;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (400.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              
              float distance = length(mvPosition.xyz);
              vOpacity = 1.0 - smoothstep(200.0, 600.0, distance);
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vOpacity;
            void main() {
              float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
              if (distanceToCenter > 0.5) discard;
              
              float alpha = 1.0 - (distanceToCenter * 2.0);
              alpha = smoothstep(0.0, 1.0, alpha);
              
              gl_FragColor = vec4(vColor, alpha * vOpacity * 0.5);
            }
          `}
        />
      </points>
      
      {/* NEW: Big swirls */}
      <group ref={bigSwirlsRef}>
        {particleData.bigSwirls.map((swirl, index) => (
          <points key={`${particleKey}-bigswirl-${index}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={swirl.positions}
                count={800}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-color"
                array={swirl.colors}
                count={800}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-size"
                array={swirl.sizes}
                count={800}
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
                varying float vOpacity;
                void main() {
                  vColor = color;
                  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                  gl_PointSize = size * (500.0 / -mvPosition.z);
                  gl_Position = projectionMatrix * mvPosition;
                  
                  float distance = length(mvPosition.xyz);
                  vOpacity = 1.0 - smoothstep(150.0, 500.0, distance);
                }
              `}
              fragmentShader={`
                varying vec3 vColor;
                varying float vOpacity;
                void main() {
                  float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                  if (distanceToCenter > 0.5) discard;
                  
                  float alpha = 1.0 - (distanceToCenter * 2.0);
                  alpha = smoothstep(0.0, 1.0, alpha);
                  
                  gl_FragColor = vec4(vColor, alpha * vOpacity * 0.4);
                }
              `}
            />
          </points>
        ))}
      </group>
    </group>
  );
};

export default MilkyWayParticleSystem;