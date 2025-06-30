// src/store/sceneStore.ts - Updated with larger default photo size
import { create } from 'zustand';

export type SceneSettings = {
  animationPattern: 'float' | 'wave' | 'spiral' | 'grid';
  gridAspectRatioPreset: '1:1' | '4:3' | '16:9' | '21:9' | 'custom';
  particles: {
    enabled: boolean;
    theme: string; // Will store the theme name
    intensity: number; // 0-1 for particle density
  };
  patterns: {
    grid: {
      enabled: boolean;
      spacing: number;
      aspectRatio: number;
      wallHeight: number;
      photoCount?: number;
    };
    float: {
      enabled: boolean;
      spacing: number;
      height: number;
      spread: number;
      photoCount?: number;
    };
    wave: {
      enabled: boolean;
      spacing: number;
      amplitude: number;
      frequency: number;
      photoCount?: number;
    };
    spiral: {
      enabled: boolean;
      spacing: number;
      radius: number;
      heightStep: number;
      photoCount?: number;
    };
  };
  cameraAnimation: {
    enabled: boolean;
    type: 'none' | 'orbit' | 'figure8' | 'centerRotate' | 'wave' | 'spiral';
    speed: number;
    radius: number;
    height: number;
    amplitude: number;
    frequency: number;
  };
  animationSpeed: number;
  animationEnabled: boolean;
  photoCount: number;
  backgroundColor: string;
  backgroundGradient: boolean;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  backgroundGradientAngle: number;
  emptySlotColor: string;
  cameraDistance: number;
  cameraRotationEnabled: boolean;
  cameraRotationSpeed: number;
  cameraHeight: number;
  cameraEnabled: boolean;
  spotlightCount: number;
  spotlightHeight: number;
  spotlightDistance: number;
  spotlightAngle: number;
  spotlightWidth: number;
  spotlightPenumbra: number;
  ambientLightIntensity: number;
  spotlightIntensity: number;
  spotlightColor: string;
  floorEnabled: boolean;
  floorColor: string;
  floorOpacity: number;
  floorSize: number;
  floorReflectivity: number;
  floorMetalness: number;
  floorRoughness: number;
  gridEnabled: boolean;
  gridColor: string;
  gridSize: number;
  gridDivisions: number;
  gridOpacity: number;
  photoSize: number;
  photoRotation: boolean;
  photoSpacing: number;
  wallHeight: number;
  gridAspectRatio: number;
  photoBrightness: number;
};

const defaultSettings: SceneSettings = {
  animationPattern: 'grid',
  gridAspectRatioPreset: '16:9',
  animationSpeed: 50,
  animationEnabled: true,
  photoCount: 50,
  backgroundColor: '#000000',
  backgroundGradient: false,
  backgroundGradientStart: '#000000',
  backgroundGradientEnd: '#1a1a1a',
  backgroundGradientAngle: 180,
  emptySlotColor: '#1A1A1A',
  cameraDistance: 25,
  cameraRotationEnabled: true,
  cameraRotationSpeed: 0.2,
  cameraHeight: 10,
  cameraEnabled: true,
  cameraAnimation: {
    enabled: false,
    type: 'none',
    speed: 0.3,
    radius: 30,
    height: 15,
    amplitude: 8,
    frequency: 0.5
  },
  spotlightCount: 4,
  spotlightHeight: 30,
  spotlightDistance: 40,
  spotlightAngle: Math.PI / 4,
  spotlightWidth: 0.6,
  spotlightPenumbra: 0.4,
  ambientLightIntensity: 0.8,
  spotlightIntensity: 150.0,
  spotlightColor: '#ffffff',
  floorEnabled: true,
  floorColor: '#1A1A1A',
  floorOpacity: 0.8,
  floorSize: 200,
  floorReflectivity: 0.8,
  floorMetalness: 0.7,
  floorRoughness: 0.2,
  gridEnabled: true,
  gridColor: '#444444',
  gridSize: 200,
  gridDivisions: 30,
  gridOpacity: 1.0,
  photoSize: 6.0, // INCREASED: From 4.0 to 6.0 for better visibility in grid pattern
  photoRotation: true,
  photoSpacing: 0, // SOLID WALL: Default to edge-to-edge photos
  wallHeight: 0,
  gridAspectRatio: 1.77778,
  photoBrightness: 1.0, // 1.0 = natural photo brightness (100%)
  particles: {
    enabled: true,
    theme: 'Purple Magic', // Default theme name
    intensity: 0.7 // 70% intensity by default
  },
  patterns: {
    grid: {
      enabled: true,
      spacing: 0.1,
      aspectRatio: 1.77778,
      wallHeight: 0,
      photoCount: 50
    },
    float: {
      enabled: false,
      spacing: 0.1,
      height: 30,
      spread: 25,
      photoCount: 100
    },
    wave: {
      enabled: false,
      spacing: 0.15,
      amplitude: 5,
      frequency: 0.5,
      photoCount: 75
    },
    spiral: {
      enabled: false,
      spacing: 0.1,
      radius: 15,
      heightStep: 0.5,
      photoCount: 150
    }
  }
};

type SceneState = {
  settings: SceneSettings;
  updateSettings: (settings: Partial<SceneSettings>, debounce?: boolean) => void;
  resetSettings: () => void;
};

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

// Deep merge function for nested objects
const deepMerge = (target: any, source: any): any => {
  const output = { ...target };
  
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
};

export const useSceneStore = create<SceneState>()((set, get) => {
  const immediateUpdate = (newSettings: Partial<SceneSettings>) => {
    const currentSettings = get().settings;

    // Handle pattern changes
    if (newSettings.animationPattern && newSettings.animationPattern !== currentSettings.animationPattern) {
      // Update enabled states for patterns
      const updatedPatterns = { ...currentSettings.patterns };
      const oldPattern = currentSettings.animationPattern;
      const newPattern = newSettings.animationPattern;
      
      // Disable all patterns first
      Object.keys(updatedPatterns).forEach(pattern => {
        updatedPatterns[pattern as keyof typeof updatedPatterns].enabled = false;
      });
      
      // Enable the selected pattern
      if (newPattern && updatedPatterns[newPattern]) {
        updatedPatterns[newPattern].enabled = true;
        
        // Update the global photoCount based on the pattern-specific photoCount
        if (updatedPatterns[newPattern].photoCount !== undefined) {
          newSettings.photoCount = updatedPatterns[newPattern].photoCount;
        }
      }
      
      // Update the patterns in newSettings
      newSettings.patterns = updatedPatterns;
    }

    // Handle photo count validation
    if (newSettings.photoCount !== undefined) {
      const count = Math.min(Math.max(5, Math.floor(Number(newSettings.photoCount))), 500);
      if (!isNaN(count)) {
        newSettings.photoCount = count;
      } else {
        delete newSettings.photoCount;
      }
    }

    // Handle photo brightness validation
    if (newSettings.photoBrightness !== undefined) {
      const brightness = Math.min(Math.max(0.1, Number(newSettings.photoBrightness)), 3);
      if (!isNaN(brightness)) {
        newSettings.photoBrightness = brightness;
      } else {
        delete newSettings.photoBrightness;
      }
    }

    // Handle photo size validation
    if (newSettings.photoSize !== undefined) {
      const size = Math.min(Math.max(1, Number(newSettings.photoSize)), 20);
      if (!isNaN(size)) {
        newSettings.photoSize = size;
      } else {
        delete newSettings.photoSize;
      }
    }

    // Handle photo spacing validation
    if (newSettings.photoSpacing !== undefined) {
      const spacing = Math.min(Math.max(0, Number(newSettings.photoSpacing)), 1);
      if (!isNaN(spacing)) {
        newSettings.photoSpacing = spacing;
      } else {
        delete newSettings.photoSpacing;
      }
    }

    set((state) => ({
      settings: deepMerge(state.settings, newSettings),
    }));
  };

  const debouncedUpdate = debounce(immediateUpdate, 100);

  return {
    settings: defaultSettings,
    updateSettings: (newSettings: Partial<SceneSettings>, debounce = false) => {
      if (debounce) {
        debouncedUpdate(newSettings);
      } else {
        immediateUpdate(newSettings);
      }
    },
    resetSettings: () => set({ settings: defaultSettings }),
  };
});

export { defaultSettings };