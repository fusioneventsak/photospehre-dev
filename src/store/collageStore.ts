// src/store/collageStore.ts - FIXED: Handle missing collages properly
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';
import { RealtimeChannel } from '@supabase/supabase-js';

// Helper function to get file URL
const getFileUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Helper for deep merging objects
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// Default scene settings
const defaultSettings = {
  animationPattern: 'grid_wall',
  photoCount: 100,
  animationSpeed: 50,
  cameraDistance: 15,
  cameraHeight: 8,
  cameraRotationSpeed: 20,
  photoSize: 1.0,
  photoBrightness: 1.0,
  backgroundColor: '#000000',
  backgroundGradient: true,
  backgroundGradientStart: '#1a1a2e',
  backgroundGradientEnd: '#16213e',
  backgroundGradientAngle: 45,
  floorColor: '#111111',
  showFloor: true,
  showGrid: true,
  ambientLightIntensity: 0.4,
  spotlightIntensity: 0.8,
  patterns: {
    grid_wall: { enabled: true },
    float: { enabled: false },
    wave: { enabled: false },
    spiral: { enabled: false }
  }
};

export interface Photo {
  id: string;
  collage_id: string;
  url: string;
  created_at: string;
}

export interface Collage {
  id: string;
  name: string;
  code: string;
  created_at: string;
  settings: any;
}

export interface SceneSettings {
  animationPattern?: string;
  patterns?: any;
  photoCount?: number;
  animationSpeed?: number;
  cameraDistance?: number;
  cameraHeight?: number;
  cameraRotationSpeed?: number;
  photoSize?: number;
  photoBrightness?: number;
  backgroundColor?: string;
  backgroundGradient?: boolean;
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundGradientAngle?: number;
  floorColor?: string;
  showFloor?: boolean;
  showGrid?: boolean;
  ambientLightIntensity?: number;
  spotlightIntensity?: number;
  [key: string]: any;
}

interface CollageStore {
  // State
  photos: Photo[];
  currentCollage: Collage | null;
  loading: boolean;
  error: string | null;
  collages: Collage[];
  realtimeChannel: RealtimeChannel | null;
  isRealtimeConnected: boolean;
  lastRefreshTime: number;
  pollingInterval: NodeJS.Timeout | null;

  // Actions
  fetchCollages: () => Promise<void>;
  fetchCollageByCode: (code: string) => Promise<Collage | null>;
  fetchCollageById: (id: string) => Promise<Collage | null>;
  createCollage: (name: string) => Promise<Collage | null>;
  updateCollageSettings: (collageId: string, settings: Partial<SceneSettings>) => Promise<any>;
  updateCollageName: (collageId: string, name: string) => Promise<any>;
  uploadPhoto: (collageId: string, file: File) => Promise<Photo | null>;
  deletePhoto: (photoId: string) => Promise<void>;
  fetchPhotosByCollageId: (collageId: string) => Promise<void>;
  refreshPhotos: (collageId: string) => Promise<void>;
  
  // Real-time subscription methods
  setupRealtimeSubscription: (collageId: string) => void;
  cleanupRealtimeSubscription: () => void;
  
  // Internal methods
  addPhotoToState: (photo: Photo) => void;
  removePhotoFromState: (photoId: string) => void;
  startPolling: (collageId: string) => void;
  stopPolling: () => void;
}

export const useCollageStore = create<CollageStore>((set, get) => ({
  // Initial state
  photos: [],
  currentCollage: null,
  loading: false,
  error: null,
  collages: [],
  realtimeChannel: null,
  isRealtimeConnected: false,
  lastRefreshTime: 0,
  pollingInterval: null,

  // Add photo to state - ENHANCED
  addPhotoToState: (photo: Photo) => {
    console.log('➕ BEFORE addPhotoToState - Current photos count:', get().photos.length);
    console.log('➕ Adding photo with ID:', photo.id);
    set((state) => {
      const exists = state.photos.some(p => p.id === photo.id);
      if (exists) {
        console.log('🔄 Photo already exists in state:', photo.id);
        return state;
      }
      
      console.log('✅ Adding photo to state:', photo.id);
      console.log('➕ Photos array reference BEFORE:', state.photos);
      console.log('➕ Current photo IDs BEFORE:', state.photos.map(p => p.id.slice(-6)));
      
      const newPhotos = [photo, ...state.photos];
      console.log('➕ Photos array reference AFTER:', newPhotos);
      console.log('➕ Current photo IDs AFTER:', newPhotos.map(p => p.id.slice(-6)));
      
      // Add new photo at the beginning (most recent first)
      const newState = {
        photos: newPhotos,
        lastRefreshTime: Date.now()
      };
      
      console.log('➕ Setting new state:', newState);
      return newState;
    });
    
    console.log('➕ AFTER addPhotoToState - Current photos count:', get().photos.length);
  },

  // Remove photo from state - ENHANCED
  removePhotoFromState: (photoId: string) => {
    console.log('🗑️ BEFORE removePhotoFromState - Current photos count:', get().photos.length);
    console.log('🗑️ STORE: Removing photo with ID:', photoId);
    
    set((state) => {
      const beforeCount = state.photos.length;
      console.log('🗑️ Photos array reference BEFORE:', state.photos);
      console.log('🗑️ Current photo IDs BEFORE:', state.photos.map(p => p.id.slice(-6)));
      
      const newPhotos = state.photos.filter(p => p.id !== photoId);
      
      console.log('🗑️ Photos array reference AFTER:', newPhotos);
      console.log('🗑️ Current photo IDs AFTER:', newPhotos.map(p => p.id.slice(-6)));
      const afterCount = newPhotos.length;
      
      console.log(`🗑️ Photos: ${beforeCount} -> ${afterCount}`);
      
      if (beforeCount === afterCount) {
        console.log('⚠️ WARNING: Photo not found in state for removal:', photoId);
        console.log('⚠️ Current photo IDs:', state.photos.map(p => p.id));
        
        // CRITICAL: Even if the photo wasn't found, we still want to return a new state object
        // to trigger a re-render and force the UI to update
        return {
          ...state,
          lastRefreshTime: Date.now()
        };
      }
      
      const newState = {
        photos: newPhotos,
        lastRefreshTime: Date.now() // Force update timestamp to trigger re-renders
      };
      
      console.log('🗑️ Setting new state:', newState);
      return newState;
    });
    
    console.log('🗑️ AFTER removePhotoFromState - Current photos count:', get().photos.length);
  },

  // Enhanced realtime subscription with better error handling
  setupRealtimeSubscription: (collageId: string) => {
    // Clean up existing
    const currentChannel = get().realtimeChannel;
    if (currentChannel) {
      console.log('🧹 Cleaning up existing channel before creating new one');
      currentChannel.unsubscribe();
      set({ realtimeChannel: null, isRealtimeConnected: false });
    }
    if (currentChannel) {
      console.log('🧹 Cleaning up existing channel before creating new one');
      currentChannel.unsubscribe();
      set({ realtimeChannel: null, isRealtimeConnected: false });
    }

    console.log('🚀 Setting up realtime subscription for collage:', collageId);

    const channel = supabase
      .channel(`photos_${collageId}_${Date.now()}`) // Add timestamp to ensure unique channel name
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
          filter: `collage_id=eq.${collageId}`
        },
        (payload) => {
          console.log('🔔 Realtime event received:', payload.eventType, payload.new?.id || payload.old?.id);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            console.log('➕ REALTIME INSERT:', payload.new.id, 'for collage:', collageId);
            get().addPhotoToState(payload.new as Photo);
          } 
          else if (payload.eventType === 'DELETE' && payload.old) {
            console.log('🗑️ REALTIME DELETE:', payload.old.id, 'for collage:', collageId);
            // Force immediate state update for deletions
            const photoId = payload.old.id;
            console.log('🗑️ REALTIME: Calling removePhotoFromState for ID:', photoId);
            get().removePhotoFromState(photoId);
            
            // Double-check that the photo was actually removed
            setTimeout(() => {
              const currentPhotos = get().photos;
              const stillExists = currentPhotos.some(p => p.id === photoId);
              if (stillExists) {
                console.log('⚠️ Photo still exists after deletion, forcing another removal:', photoId);
                get().removePhotoFromState(photoId);
              }
            }, 500); // Increased timeout for more reliable checking
          }
          else if (payload.eventType === 'UPDATE' && payload.new) {
            console.log('📝 REALTIME UPDATE:', payload.new.id, 'for collage:', collageId);
            // Handle photo updates if needed
            set((state) => ({
              photos: state.photos.map(p => 
                p.id === payload.new.id ? payload.new as Photo : p
              ),
              lastRefreshTime: Date.now()
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Realtime status:', status);
        const connected = status === 'SUBSCRIBED';
        set({ isRealtimeConnected: connected });
        set({ isRealtimeConnected: connected });
        
        if (!connected) {
          console.log('🔄 Realtime disconnected, starting polling fallback...');
          get().startPolling(collageId);
        } else if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected, stopping polling...');
          get().stopPolling();
        }
      });

    set({ realtimeChannel: channel });
  },

  cleanupRealtimeSubscription: () => {
    const channel = get().realtimeChannel;
    
    console.log('🧹 Cleaning up realtime subscription');
    if (channel) channel.unsubscribe();
    
    set({ realtimeChannel: null, isRealtimeConnected: false });
    get().stopPolling();
  },

  // Polling fallback when realtime fails
  startPolling: (collageId: string) => {
    get().stopPolling(); // Clear any existing polling
    
    console.log('🔄 Starting polling fallback for collage:', collageId, '(every 3 seconds)');
    const interval = setInterval(() => {
      console.log('📡 Polling for photo updates...');
      get().refreshPhotos(collageId);
    }, 3000); // Poll every 3 seconds
    
    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const interval = get().pollingInterval;
    if (interval) {
      console.log('⏹️ Stopping polling');
      clearInterval(interval);
      set({ pollingInterval: null });
    }
  },

  refreshPhotos: async (collageId: string) => {
    try {
      await get().fetchPhotosByCollageId(collageId);
      console.log('🔄 Photos refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh photos:', error);
    }
  },

  fetchPhotosByCollageId: async (collageId: string) => {
    try {
      console.log('📸 Fetching photos for collage:', collageId);
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('collage_id', collageId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const duration = Date.now() - startTime;
      console.log(`📸 Fetched ${data?.length || 0} photos in ${duration}ms`);
      
      console.log(`📸 Fetched ${data?.length || 0} photos in ${duration}ms`);
      
      set({ 
        photos: data as Photo[], 
        lastRefreshTime: Date.now() 
      });
      
      return data as Photo[];
      
    } catch (error: any) {
      console.error('❌ Fetch photos error:', error);
      set({ error: error.message });
      throw error;
    }
  },

  fetchCollages: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('collages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ collages: data as Collage[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // FIXED: fetchCollageByCode - Handle missing collages properly
  fetchCollageByCode: async (code: string) => {
    set({ loading: true, error: null, photos: [] });
    try {
      console.log('🔍 Fetching collage by code:', code);

      // FIXED: Use .maybeSingle() instead of .single() to handle 0 rows
      const { data: collage, error: collageError } = await supabase
        .from('collages')
        .select('*')
        .eq('code', code)
        .maybeSingle(); // CHANGED: This returns null instead of throwing error when no rows found

      if (collageError) {
        console.error('❌ Collage fetch error:', collageError);
        throw collageError;
      }

      if (!collage) {
        // FIXED: Handle when collage doesn't exist
        console.log('❌ No collage found with code:', code);
        set({ 
          error: `No collage found with code "${code}". Please check the code and try again.`,
          loading: false,
          currentCollage: null 
        });
        return null;
      }

      console.log('✅ Found collage:', collage.id, collage.name);

      // Fetch settings - also use maybeSingle for consistency
      const { data: settings } = await supabase
        .from('collage_settings')
        .select('settings')
        .eq('collage_id', collage.id)
        .maybeSingle(); // CHANGED: Use maybeSingle here too

      const collageWithSettings = {
        ...collage,
        settings: settings?.settings ? deepMerge(defaultSettings, settings.settings) : defaultSettings
      } as Collage;

      set({ currentCollage: collageWithSettings, loading: false, error: null });
      
      // Fetch photos and setup subscription
      try {
        await get().fetchPhotosByCollageId(collage.id);
        get().setupRealtimeSubscription(collage.id);
      } catch (photoError) {
        console.error('❌ Error fetching initial photos:', photoError);
        // Don't fail the whole operation if photos can't be fetched
      }
      
      console.log('✅ Successfully loaded collage:', collage.name);
      return collageWithSettings;
    } catch (error: any) {
      console.error('❌ fetchCollageByCode error:', error);
      set({ 
        error: error.message || 'Failed to load collage', 
        loading: false,
        currentCollage: null 
      });
      return null;
    }
  },

  // FIXED: fetchCollageById - Handle missing collages properly
  fetchCollageById: async (id: string) => {
    set({ loading: true, error: null, photos: [] });
    try {
      console.log('🔍 Fetching collage by ID:', id);

      // FIXED: Use .maybeSingle() instead of .single()
      const { data: collage, error: collageError } = await supabase
        .from('collages')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // CHANGED: This returns null instead of throwing error when no rows found

      if (collageError) {
        console.error('❌ Collage fetch error:', collageError);
        throw collageError;
      }

      if (!collage) {
        // FIXED: Handle when collage doesn't exist
        console.log('❌ No collage found with ID:', id);
        set({ 
          error: `No collage found with ID "${id}".`,
          loading: false,
          currentCollage: null 
        });
        return null;
      }

      console.log('✅ Found collage:', collage.id, collage.name);

      // Fetch settings - also use maybeSingle for consistency
      const { data: settings } = await supabase
        .from('collage_settings')
        .select('settings')
        .eq('collage_id', id)
        .maybeSingle(); // CHANGED: Use maybeSingle here too

      const collageWithSettings = {
        ...collage,
        settings: settings?.settings ? deepMerge(defaultSettings, settings.settings) : defaultSettings
      } as Collage;

      set({ currentCollage: collageWithSettings, loading: false, error: null });
      
      // Fetch photos and setup subscription
      try {
        await get().fetchPhotosByCollageId(id);
        get().setupRealtimeSubscription(id);
      } catch (photoError) {
        console.error('❌ Error fetching initial photos:', photoError);
        // Don't fail the whole operation if photos can't be fetched
      }
      
      console.log('✅ Successfully loaded collage:', collage.name);
      return collageWithSettings;
    } catch (error: any) {
      console.error('❌ fetchCollageById error:', error);
      set({ 
        error: error.message || 'Failed to load collage', 
        loading: false,
        currentCollage: null 
      });
      return null;
    }
  },

  createCollage: async (name: string) => {
    set({ loading: true, error: null });
    try {
      // Generate a 4-digit random code
      const generateCode = () => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 4; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
      
      // Initial code generation
      let code = generateCode();
      console.log('Creating collage:', name, 'with initial code:', code);
      
      // Try to insert with the generated code
      let { data: collage, error: collageError } = await supabase
        .from('collages')
        .insert([{ name, code }])
        .select()
        .single();
      
      // If there's a unique constraint violation, try again with a new code
      let attempts = 1;
      const MAX_ATTEMPTS = 5;
      
      while (collageError && collageError.code === '23505' && attempts < MAX_ATTEMPTS) {
        console.log(`Code ${code} already exists, trying again (attempt ${attempts}/${MAX_ATTEMPTS})`);
        code = generateCode();
        attempts++;
        
        // Try again with a new code
        const result = await supabase
          .from('collages')
          .insert([{ name, code }])
          .select()
          .single();
          
        collage = result.data;
        collageError = result.error;
      }
      
      if (collageError) throw collageError;
      
      // The trigger will automatically create default settings
      // Fetch the settings that were created by the trigger
      const { data: settings, error: settingsError } = await supabase
        .from('collage_settings')
        .select('*')
        .eq('collage_id', collage.id)
        .single();
      
      if (settingsError) {
        console.warn('Warning: Could not fetch collage settings:', settingsError);
        // Don't throw here, we can still return the collage without settings
      }

      const collageWithSettings = {
        ...collage,
        settings: settings?.settings || defaultSettings
      } as Collage;

      set((state) => ({
        collages: [collageWithSettings, ...state.collages],
        loading: false
      }));

      return collageWithSettings;
    } catch (error: any) {
      console.error('Create collage error:', error);
      
      // Provide a more user-friendly error message
      let errorMessage = error.message;
      if (error.code === '23505') {
        errorMessage = 'Could not generate a unique code. Please try again.';
      }
      
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  updateCollageSettings: async (collageId: string, settings: Partial<SceneSettings>) => {
    try {
      const currentCollage = get().currentCollage;
      if (!currentCollage) throw new Error('No current collage');

      const mergedSettings = deepMerge(currentCollage.settings, settings);

      const { data, error } = await supabase
        .from('collage_settings')
        .update({ settings: mergedSettings })
        .eq('collage_id', collageId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        currentCollage: state.currentCollage ? {
          ...state.currentCollage,
          settings: mergedSettings
        } : null
      }));

      return data;
    } catch (error: any) {
      console.error('Failed to update collage settings:', error.message);
      throw error;
    }
  },

  // NEW: Update collage name
  updateCollageName: async (collageId: string, name: string) => {
    try {
      console.log('📝 Updating collage name:', collageId, name);

      const { data, error } = await supabase
        .from('collages')
        .update({ name })
        .eq('id', collageId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set((state) => ({
        currentCollage: state.currentCollage ? {
          ...state.currentCollage,
          name: name
        } : null,
        collages: state.collages.map(collage => 
          collage.id === collageId ? { ...collage, name } : collage
        )
      }));

      console.log('✅ Collage name updated successfully');
      return data;
    } catch (error: any) {
      console.error('❌ Failed to update collage name:', error);
      throw error;
    }
  },

  // Enhanced upload with better error handling
  uploadPhoto: async (collageId: string, file: File) => {
    try {
      console.log('📤 Starting photo upload:', file.name, 'for collage:', collageId);
      
      // Validation
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 10MB limit');
      }

      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only images are supported.');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${collageId}/${nanoid()}.${fileExt}`;

      console.log('📤 Uploading to storage path:', fileName);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ File uploaded to storage:', uploadData.path);

      // Get public URL
      const publicUrl = getFileUrl('photos', uploadData.path);
      console.log('🔗 Public URL:', publicUrl);

      // Insert photo record
      const { data: photo, error: dbError } = await supabase
        .from('photos')
        .insert([{
          collage_id: collageId,
          url: publicUrl
        }])
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('photos').remove([uploadData.path]);
        throw dbError;
      }

      console.log('✅ Photo record created:', photo.id);
      console.log('🔔 Realtime should now broadcast this to all clients');
      
      // Add to local state immediately for instant feedback
      get().addPhotoToState(photo as Photo);
      
      return photo as Photo;
      
    } catch (error: any) {
      console.error('❌ Upload photo error:', error);
      throw error;
    }
  },

  // Enhanced delete with better error handling
  deletePhoto: async (photoId: string) => {
    try {
      console.log('🗑️ STORE: Starting photo deletion process for ID:', photoId);
      console.log('🗑️ Photos count BEFORE database deletion:', get().photos.length);
      
      // First, get the photo to find the storage path
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('url')
        .eq('id', photoId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching photo for deletion:', fetchError);
        throw fetchError;
      }

      // Extract storage path from URL
      const url = new URL(photo.url);
      const pathParts = url.pathname.split('/');
      const storagePathIndex = pathParts.findIndex(part => part === 'photos');
      
      if (storagePathIndex === -1) {
        throw new Error('Invalid photo URL format');
      }
      
      const storagePath = pathParts.slice(storagePathIndex + 1).join('/');
      console.log('🗑️ Storage path:', storagePath);

      // Delete from database first
      const { error: deleteDbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (deleteDbError) {
        console.error('❌ Database delete error:', deleteDbError);
        throw deleteDbError;
      } else {
        console.log('✅ Photo record deleted from database, ID:', photoId);
        
        // CRITICAL: Remove from local state immediately for instant feedback
        // This ensures the UI updates even if realtime notification fails
        console.log('🗑️ Calling removePhotoFromState from deletePhoto');
        get().removePhotoFromState(photoId);
        console.log('🗑️ Photos count AFTER removePhotoFromState:', get().photos.length);
      }

      // Delete from storage
      try {
        const { error: deleteStorageError } = await supabase.storage
          .from('photos')
          .remove([storagePath]);
  
        if (deleteStorageError) {
          console.warn('⚠️ Storage delete error (non-fatal):', deleteStorageError);
          // Don't throw here as the database record is already deleted
        } else {
          console.log('✅ Photo file deleted from storage');
        }
      } catch (storageError) {
        console.warn('⚠️ Storage delete exception (non-fatal):', storageError);
        // Continue even if storage deletion fails
      }

      console.log('✅ Photo deletion process completed for ID:', photoId);
      console.log('🗑️ Final photos count:', get().photos.length);
      
      // Return void to match the function signature
      return;
    } catch (error: any) {
      console.error('❌ Delete photo error:', error);
      throw error;
    }
  }
}));