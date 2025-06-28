// src/components/three/patterns/SlotManager.ts
// A class to manage stable slot assignments for photos

// Debug flag for logging
const DEBUG = true;

export class SlotManager {
  slotAssignments = new Map<string, number>(); // Maps photo ID to slot index
  private occupiedSlots = new Set<number>(); // Tracks which slots are in use
  private availableSlots: number[] = []; // Pre-calculated available slots
  private maxSlots = 0;

  constructor(totalSlots: number) {
    this.updateSlotCount(totalSlots);
  }

  updateSlotCount(newTotal: number) {
    if (DEBUG) console.log(`🎮 SLOT MANAGER: Updating slot count from ${this.maxSlots} to ${newTotal}`);
    this.maxSlots = newTotal;
    this.rebuildAvailableSlots();

    // Remove any photos assigned to slots that no longer exist
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (slotIndex >= newTotal) {
        if (DEBUG) console.log(`🎮 SLOT MANAGER: Removing photo ${photoId.slice(-6)} from slot ${slotIndex} (out of range)`);
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
      }
    }
    
    this.rebuildAvailableSlots();
  }
  
  // Rebuild the available slots array based on current occupancy
  private rebuildAvailableSlots() {
    this.availableSlots = [];
    for (let i = 0; i < this.maxSlots; i++) {
      if (!this.occupiedSlots.has(i)) {
        this.availableSlots.push(i);
      }
    }
    // Sort available slots to ensure consistent assignment order
    this.availableSlots.sort((a, b) => a - b);
  }

  // Find the next available slot index
  private findAvailableSlot(): number {
    // Use pre-calculated available slots if possible
    if (this.availableSlots.length > 0) {
      return this.availableSlots.shift()!;
    }
    
    // If all slots are taken, return the max slot (shouldn't happen)
    return this.maxSlots;
  }

  // CRITICAL FIX: Only assign new slots to new photos, preserve existing assignments
  assignSlots(photos: any[]): Map<string, number> {
    const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];

    if (DEBUG) console.log(`🎮 SLOT MANAGER: Assigning slots for ${safePhotos.length} photos, max slots: ${this.maxSlots}`);
    
    // Get current photo IDs
    const currentPhotoIds = new Set(safePhotos.map(p => p.id));
    
    // CRITICAL: Only remove deleted photos from slots, don't reassign existing ones
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (!currentPhotoIds.has(photoId)) {
        // Photo was deleted - clear its slot but keep the slot available
        if (DEBUG) console.log(`🗑️ SLOT MANAGER: Clearing slot ${slotIndex} for deleted photo ${photoId.slice(-6)}`);
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
        this.availableSlots.push(slotIndex);
        // Keep available slots sorted
        this.availableSlots.sort((a, b) => a - b);
      }
    }
    
    // Preserve existing assignments for photos that still exist
    for (const photo of safePhotos) {
      if (this.slotAssignments.has(photo.id)) {
        const slotIndex = this.slotAssignments.get(photo.id)!;
        this.occupiedSlots.add(slotIndex);
        // Remove this slot from available slots if it's there
        const availableIndex = this.availableSlots.indexOf(slotIndex);
        if (availableIndex !== -1) {
          this.availableSlots.splice(availableIndex, 1);
        }
      }
    }

    // ONLY assign slots to NEW photos that don't have assignments yet
    for (const photo of safePhotos) {
      if (!this.slotAssignments.has(photo.id)) {
        const availableSlot = this.findAvailableSlot();
        if (availableSlot < this.maxSlots) {
          if (DEBUG) console.log(`➕ SLOT MANAGER: Assigning new photo ${photo.id.slice(-6)} to slot ${availableSlot}`);
          this.slotAssignments.set(photo.id, availableSlot);
          this.occupiedSlots.add(availableSlot);
        }
      }
    }

    return new Map(this.slotAssignments);
  }
  
  // Get stats about slot usage
  getStats() {
    const occupiedSlots = this.occupiedSlots.size;
    const availableSlots = this.maxSlots - occupiedSlots;
    
    return {
      totalSlots: this.maxSlots,
      occupiedSlots: occupiedSlots,
      availableSlots: availableSlots,
      assignments: this.slotAssignments.size
    };
  }
}

export default SlotManager;