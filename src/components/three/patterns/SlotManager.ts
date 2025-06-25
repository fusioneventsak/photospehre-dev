// src/components/three/patterns/SlotManager.ts
// A class to manage stable slot assignments for photos

export class SlotManager {
  private slotAssignments = new Map<string, number>();
  private occupiedSlots = new Set<number>();
  private availableSlots: number[] = [];
  private totalSlots = 0;
  private deletedSlots: number[] = []; // Track slots that were previously occupied but now empty

  constructor(totalSlots: number) {
    this.updateSlotCount(totalSlots);
  }

  updateSlotCount(newTotal: number) {
    if (newTotal === this.totalSlots) return;
    
    console.log(`🎰 SlotManager: Updating slot count from ${this.totalSlots} to ${newTotal}`);
    
    this.totalSlots = newTotal;
    
    // Remove assignments for slots that no longer exist
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (slotIndex >= newTotal) {
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
      }
    }
    
    this.rebuildAvailableSlots();
  }

  private rebuildAvailableSlots() {
    this.availableSlots = [];
    
    // First, add any previously deleted slots to ensure they get reused first
    for (const slot of this.deletedSlots) {
      if (slot < this.totalSlots && !this.occupiedSlots.has(slot)) {
        this.availableSlots.push(slot);
      }
    }
    
    // Then add any other available slots
    for (let i = 0; i < this.totalSlots; i++) {
      if (!this.occupiedSlots.has(i) && !this.availableSlots.includes(i)) {
        this.availableSlots.push(i);
      }
    }
    
    // Sort available slots to ensure consistent assignment order
    this.availableSlots.sort((a, b) => a - b);
    
    // Clear the deleted slots array since we've incorporated them
    this.deletedSlots = [];
    
    console.log(`🎰 SlotManager: Rebuilt available slots, ${this.availableSlots.length} available`);
  }

  // CRITICAL FIX: Only assign new slots to new photos, preserve existing assignments
  assignSlots(photos: any[]): Map<string, number> {
    const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
    const photoCount = safePhotos.length;
    
    // Get current photo IDs
    const currentPhotoIds = new Set(safePhotos.map(p => p.id));
    
    // Find photos that were removed
    const removedPhotoIds: string[] = [];
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (!currentPhotoIds.has(photoId)) {
        removedPhotoIds.push(photoId);
        console.log(`🎰 SlotManager: Photo ${photoId.slice(-6)} was removed, marking slot ${slotIndex} for reuse`);
        // Add the slot to deletedSlots to prioritize its reuse
        this.deletedSlots.push(slotIndex);
      }
    }
    
    // Remove assignments for photos that no longer exist
    for (const photoId of removedPhotoIds) {
      const slotIndex = this.slotAssignments.get(photoId);
      if (slotIndex !== undefined) {
        console.log(`🎰 SlotManager: Photo ${photoId.slice(-6)} removed, freeing slot ${slotIndex}`);
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
      }
    }
    
    // Rebuild available slots if any photos were removed
    if (removedPhotoIds.length > 0) {
      this.rebuildAvailableSlots();
    }

    // Sort photos for consistent assignment order
    const sortedPhotos = [...safePhotos].sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return a.id.localeCompare(b.id);
    });

    // ONLY assign slots to NEW photos that don't have assignments yet
    for (const photo of sortedPhotos) {
      if (!this.slotAssignments.has(photo.id) && this.availableSlots.length > 0) {
        // Get the next available slot
        const newSlot = this.availableSlots.shift()!;
        console.log(`🎰 SlotManager: Assigning new photo ${photo.id.slice(-6)} to slot ${newSlot}`);
        this.slotAssignments.set(photo.id, newSlot);
        this.occupiedSlots.add(newSlot);
        console.log(`🎰 SlotManager: Assigned slot ${newSlot} to new photo ${photo.id.slice(-6)}`);
      }
    }

    // Log a summary of the current state
    console.log(`🎰 SlotManager: ${photoCount} photos, ${this.slotAssignments.size} assignments, ${this.availableSlots.length} available slots`);
    
    return new Map(this.slotAssignments);
  }
  
  // Get stats about slot usage
  getStats() {
    return {
      totalSlots: this.totalSlots,
      occupiedSlots: this.occupiedSlots.size,
      availableSlots: this.availableSlots.length,
      deletedSlots: this.deletedSlots.length,
      assignments: this.slotAssignments.size
    };
  }
}

export default SlotManager;