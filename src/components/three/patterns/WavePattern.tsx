import { BasePattern, type PatternState, type Position } from './BasePattern';

export class WavePattern extends BasePattern {
  generatePositions(time: number): PatternState {
    const positions: Position[] = [];
    const rotations: [number, number, number][] = [];

    // Apply animation speed directly to the animation parameters
    const speedFactor = this.settings.animationSpeed / 50;

    // Use pattern-specific photoCount if available
    const photoCount = this.settings.patterns?.wave?.photoCount !== undefined 
      ? this.settings.patterns.wave.photoCount 
      : this.settings.photoCount;
    
    const spacing = this.settings.photoSize * (1 + (this.settings.patterns?.wave?.spacing || this.settings.photoSpacing || 0.15));
    const totalPhotos = Math.min(photoCount, 500);
    
    // Calculate grid dimensions based on total photos
    const columns = Math.ceil(Math.sqrt(totalPhotos));
    const rows = Math.ceil(totalPhotos / columns);
    
    // Apply speed factor directly to wave phase
    const wavePhase = time * speedFactor * 2;
    
    // Generate positions for all photos
    for (let i = 0; i < totalPhotos; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      // Calculate base grid position
      let x = (col - columns / 2) * spacing;
      let z = (row - rows / 2) * spacing;
      
      // Calculate wave height based on distance from center
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const amplitude = this.settings.patterns?.wave?.amplitude || 5;
      const frequency = this.settings.patterns?.wave?.frequency || 0.5;
      
      let y = this.settings.wallHeight;
      
      if (this.settings.animationEnabled) {
        // Apply wave motion with phase
        y += Math.sin(distanceFromCenter * frequency - wavePhase * speedFactor) * amplitude;
        y += Math.sin(distanceFromCenter * frequency - (wavePhase * speedFactor)) * amplitude;
        // Add some vertical offset based on distance
        y += Math.sin(wavePhase * 0.5 * speedFactor) * (distanceFromCenter * 0.1);
      }
      
      positions.push([x, y, z]);

      // Calculate rotations if photo rotation is enabled
      if (this.settings.photoRotation) {
        const angle = Math.atan2(x, z);
        // Apply speed factor to rotation
        const rotationX = Math.sin(wavePhase * 0.5 * speedFactor + distanceFromCenter * 0.1) * 0.1;
        const rotationY = angle;
        const rotationZ = Math.cos(wavePhase * 0.5 * speedFactor + distanceFromCenter * 0.1) * 0.1;
        rotations.push([rotationX, rotationY, rotationZ]);
      } else {
        rotations.push([0, 0, 0]);
      }
    }

    return { positions, rotations };
  }
}