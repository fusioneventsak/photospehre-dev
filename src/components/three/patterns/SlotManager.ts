// src/components/three/patterns/SlotManager.ts
// A class to manage stable slot assignments for photos

// Debug flag for logging
const DEBUG = false;

export class SlotManager {
  private photoSlots = new Map<string, number>(); // Maps photo ID to slot index
  private slotPhotos = new Map<number, any>(); // Maps slot index to photo object
  private maxSlots = 0;

  constructor(totalSlots: number) {
    this.updateSlotCount(totalSlots);
  }

  updateSlotCount(newTotal: number) {
    if (DEBUG) console.log(`🎮 SLOT MANAGER: Updating slot count from ${this.maxSlots} to ${newTotal}`);
    this.maxSlots = newTotal;

    // Remove any photos assigned to slots that no longer exist
    for (const [photoId, slotIndex] of this.photoSlots.entries()) {
      if (slotIndex >= newTotal) {
        if (DEBUG) console.log(`🎮 SLOT MANAGER: Removing photo ${photoId.slice(-6)} from slot ${slotIndex} (out of range)`);
        this.photoSlots.delete(photoId);
        this.slotPhotos.delete(slotIndex);
      }
    }
  }

  // Find the next available slot index
  private findAvailableSlot(): number {
    // First, look for any empty slots (slots without photos)
    for (let i = 0; i < this.maxSlots; i++) {
      if (!this.slotPhotos.has(i)) {
        return i;
      }
    }
    // If all slots are taken, return the max slot (shouldn't happen)
    return this.maxSlots;
  }

  // CRITICAL FIX: Only assign new slots to new photos, preserve existing assignments
  assignSlots(photos: any[]): Map<string, number> {
    const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
    
    if (DEBUG) console.log(`🎮 SLOT MANAGER: Assigning slots for ${safePhotos.length} photos`);
    
    // Get current photo IDs
    const currentPhotoIds = new Set(safePhotos.map(p => p.id));
    
    // CRITICAL: Only remove deleted photos from slots, don't reassign existing ones
    for (const [photoId, slotIndex] of this.photoSlots.entries()) {
      if (!currentPhotoIds.has(photoId)) {
        // Photo was deleted - clear its slot but keep the slot available
        if (DEBUG) console.log(`🗑️ SLOT MANAGER: Clearing slot ${slotIndex} for deleted photo ${photoId.slice(-6)}`);
        this.photoSlots.delete(photoId);
        this.slotPhotos.delete(slotIndex);
      }
    }
    
    // Preserve existing assignments for photos that still exist
    for (const photo of safePhotos) {
      if (this.photoSlots.has(photo.id)) {
        const slotIndex = this.photoSlots.get(photo.id)!;
        this.slotPhotos.set(slotIndex, photo);
      }
    }

    // ONLY assign slots to NEW photos that don't have assignments yet
    for (const photo of safePhotos) {
      if (!this.photoSlots.has(photo.id)) {
        const availableSlot = this.findAvailableSlot();
        if (availableSlot < this.maxSlots) {
          if (DEBUG) console.log(`➕ SLOT MANAGER: Assigning new photo ${photo.id.slice(-6)} to slot ${availableSlot}`);
          this.photoSlots.set(photo.id, availableSlot);
          this.slotPhotos.set(availableSlot, photo);
        }
      }
    }

    return new Map(this.photoSlots);
  }
  
  // Get stats about slot usage
  getStats() {
    const occupiedSlots = this.slotPhotos.size;
    const availableSlots = this.maxSlots - occupiedSlots;
    
    return {
      totalSlots: this.maxSlots,
      occupiedSlots: occupiedSlots,
      availableSlots: availableSlots,
      assignments: this.photoSlots.size
    };
  }
}

export default SlotManager;