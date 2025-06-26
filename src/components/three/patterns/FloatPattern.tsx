// src/components/three/patterns/FloatPattern.tsx - UPDATED: Higher float height for better teleport
import { BasePattern, type PatternState, type Position } from './BasePattern';

export class FloatPattern extends BasePattern {
  // CRITICAL: Use dynamic base positions that adjust to floor size
  private static basePositionsCache = new Map<string, { x: number; z: number; phaseOffset: number }[]>();
  private static maxSlotsGenerated = 0;

  // Generate base positions that adapt to floor size
  private generateDynamicBasePositions(maxSlots: number, floorSize: number) {
    // Create a cache key based on floor size and slot count
    const cacheKey = `${floorSize}-${maxSlots}`;
    
    if (!FloatPattern.basePositionsCache.has(cacheKey) || maxSlots > FloatPattern.maxSlotsGenerated) {
      console.log('🎈 FLOAT: Generating edge-to-edge positions for floor size:', floorSize, 'slots:', maxSlots);
      
      // Always generate for the maximum possible slots to ensure stability
      const totalSlots = Math.max(maxSlots, 500);
      FloatPattern.maxSlotsGenerated = Math.max(FloatPattern.maxSlotsGenerated, totalSlots);
      
      // FIXED: Use FULL floor area edge-to-edge
      const fullFloorArea = floorSize; // Use entire floor
      const halfFloor = fullFloorArea / 2;
      
      const positions = [];
      
      for (let i = 0; i < totalSlots; i++) {
        // COMPLETELY DIFFERENT APPROACH: Direct random distribution across entire floor
        // Use deterministic random but cover the FULL area
        
        // Deterministic pseudo-random values based on slot index (never changes)
        const randomX = Math.sin(i * 2.73 + 1.123); // -1 to 1
        const randomZ = Math.cos(i * 3.37 + 2.456); // -1 to 1
        const phaseOffset = (i * 0.211) % 1; // 0 to 1, for staggering
        
        // EDGE-TO-EDGE: Map random values directly to full floor bounds
        const finalX = randomX * halfFloor; // -halfFloor to +halfFloor
        const finalZ = randomZ * halfFloor; // -halfFloor to +halfFloor
        
        positions.push({
          x: finalX,
          z: finalZ,
          phaseOffset: phaseOffset
        });
      }
      
      // Cache the positions for this floor size
      FloatPattern.basePositionsCache.set(cacheKey, positions);
      console.log('🎈 FLOAT: Generated', positions.length, 'positions across FULL floor area', fullFloorArea, 'edge-to-edge');
    }
    
    return FloatPattern.basePositionsCache.get(cacheKey)!;
  }

  generatePositions(time: number): PatternState {
    const positions: Position[] = [];
    const rotations: [number, number, number][] = [];
    
    // CRITICAL FIX: Apply animation speed directly to the animation parameters
    // This ensures animation speed affects float pattern properly
    const speedFactor = this.settings.animationEnabled 
      ? Math.max(0.1, this.settings.animationSpeed / 50) // Minimum 0.1 to ensure movement
      : 0; // No movement when animation is disabled

    // Use pattern-specific photoCount if available
    const photoCount = this.settings.patterns?.float?.photoCount !== undefined 
      ? this.settings.patterns.float.photoCount 
      : this.settings.photoCount;
    
    const totalPhotos = Math.min(photoCount, 500);
    
    // Use floor size from settings
    const floorSize = this.settings.floorSize || 200;
    
    // Get base positions that adapt to floor size
    const basePositions = this.generateDynamicBasePositions(totalPhotos, floorSize);
    
    // Animation parameters - apply speed factor directly
    // CRITICAL FIX: Make rise speed much faster for better visibility
    const riseSpeed = 15; // Base rise speed - will be multiplied by speedFactor
    const maxHeight = this.settings.patterns?.float?.height || 60; // Maximum height before recycling
    const startHeight = -40; // Start below the floor
    const cycleHeight = maxHeight - startHeight; // Total distance to travel (now 340 units!)
    
    // CRITICAL FIX: Use time directly, apply speedFactor to movement calculations
    const animationTime = time; // Raw time from the scene
    
    for (let i = 0; i < totalPhotos; i++) {
      // Get base position for current floor size
      const basePos = basePositions[i];
      
      // Calculate Y position with proper wrapping
      let y: number;
      
      // CRITICAL FIX: Calculate position based on animation state
      if (speedFactor > 0) {
        // Calculate total distance traveled including the phase offset
        const totalDistance = (animationTime * riseSpeed * speedFactor) + (basePos.phaseOffset * cycleHeight);
        
        // Use modulo to wrap around when reaching the top
        const positionInCycle = totalDistance % cycleHeight;
        
        // Add to start height to get actual Y position
        y = startHeight + positionInCycle;
        
        // Add subtle bobbing motion
        y += Math.sin(animationTime * 2 * speedFactor + i * 0.3) * 0.4;
      } else {
        // Static position when animation is disabled - distribute evenly through the height
        y = startHeight + (basePos.phaseOffset * cycleHeight);
      }
      
      // Add horizontal position with gentle drift
      let x = basePos.x;
      let z = basePos.z;
      
      // CRITICAL FIX: Apply drift proportional to animation speed
      if (speedFactor > 0) {
        // Gentle horizontal drift as photos rise - scale with floor size
        const driftStrength = Math.max(1.5, (this.settings.patterns?.float?.spread || 25) * 0.1);
        const driftSpeed = 0.3 * speedFactor; // Apply speedFactor to drift speed
        x += Math.sin(animationTime * driftSpeed + i * 0.5) * driftStrength;
        z += Math.cos(animationTime * driftSpeed * 0.8 + i * 0.7) * driftStrength;
      }
      
      positions.push([x, y, z]);
      
      // Calculate rotation
      // CRITICAL FIX: In float pattern, ALWAYS face camera regardless of photoRotation setting
      // This ensures photos are visible as they float up
      const rotationY = Math.atan2(-x, -z);
      
      // Add gentle wobble - apply speedFactor to wobble animation
      const wobbleX = speedFactor > 0 
        ? Math.sin(animationTime * 0.5 * speedFactor + i * 0.2) * 0.03 
        : 0;
      const wobbleZ = speedFactor > 0 
        ? Math.cos(animationTime * 0.4 * speedFactor + i * 0.3) * 0.03 
        : 0;
      
      rotations.push([wobbleX, rotationY, wobbleZ]);
    }

    return { positions, rotations };
  }
}