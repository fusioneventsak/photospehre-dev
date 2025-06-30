// src/components/collage/SceneSettings.tsx - COMPLETE: Improved photo spacing control
import React from 'react';
import { type SceneSettings } from '../../store/sceneStore';
import { Grid, Palette, CameraIcon, ImageIcon, Square, Sun, Lightbulb, RotateCw, Move, Eye, Camera, Sparkles } from 'lucide-react';
import { PARTICLE_THEMES } from '../three/MilkyWayParticleSystem';

const SceneSettings: React.FC<{
  settings: SceneSettings;
  onSettingsChange: (settings: Partial<SceneSettings>, debounce?: boolean) => void;
  onReset: () => void;
}> = ({ settings, onSettingsChange, onReset }) => {
  return (
    <div className="space-y-6">
      {/* Animation Controls */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Move className="h-4 w-4 mr-2" />
          Animation
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.animationEnabled}
              onChange={(e) => onSettingsChange({ 
                animationEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Enable Animations
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Animation Pattern
            </label>
            <select
              value={settings.animationPattern}
              onChange={(e) => onSettingsChange({ 
                animationPattern: e.target.value as 'float' | 'wave' | 'spiral' | 'grid' 
              })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
            >
              <option value="grid">Grid Wall</option>
              <option value="float">Float</option>
              <option value="wave">Wave</option>
              <option value="spiral">Spiral</option>
            </select>
          </div>
          
          {settings.animationEnabled && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Animation Speed
                <span className="ml-2 text-xs text-gray-400">
                  {settings.animationSpeed}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={settings.animationSpeed}
                onChange={(e) => onSettingsChange({ 
                  animationSpeed: parseFloat(e.target.value) 
                }, true)}
                className="w-full bg-gray-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* Photo Count and Size */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <ImageIcon className="h-4 w-4 mr-2" />
          Photo Display
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Photo Count
              <span className="ml-2 text-xs text-gray-400">
                {settings.animationPattern === 'grid' && settings.patterns?.grid?.photoCount !== undefined
                  ? settings.patterns.grid.photoCount
                  : settings.animationPattern === 'float' && settings.patterns?.float?.photoCount !== undefined
                  ? settings.patterns.float.photoCount
                  : settings.animationPattern === 'wave' && settings.patterns?.wave?.photoCount !== undefined
                  ? settings.patterns.wave.photoCount
                  : settings.animationPattern === 'spiral' && settings.patterns?.spiral?.photoCount !== undefined
                  ? settings.patterns.spiral.photoCount
                  : settings.photoCount} photos
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="500"
              step="1"
              value={
                settings.animationPattern === 'grid' && settings.patterns?.grid?.photoCount !== undefined
                  ? settings.patterns.grid.photoCount
                  : settings.animationPattern === 'float' && settings.patterns?.float?.photoCount !== undefined
                  ? settings.patterns.float.photoCount
                  : settings.animationPattern === 'wave' && settings.patterns?.wave?.photoCount !== undefined
                  ? settings.patterns.wave.photoCount
                  : settings.animationPattern === 'spiral' && settings.patterns?.spiral?.photoCount !== undefined
                  ? settings.patterns.spiral.photoCount
                  : settings.photoCount
              }
              onChange={(e) => {
                const value = parseInt(e.target.value);
                
                // Update both the global photoCount and the pattern-specific photoCount
                const updates: Partial<SceneSettings> = {
                  photoCount: value
                };
                
                // Add pattern-specific update
                if (settings.animationPattern === 'grid') {
                  updates.patterns = {
                    grid: {
                      photoCount: value
                    }
                  };
                } else if (settings.animationPattern === 'float') {
                  updates.patterns = {
                    float: {
                      photoCount: value
                    }
                  };
                } else if (settings.animationPattern === 'wave') {
                  updates.patterns = {
                    wave: {
                      photoCount: value
                    }
                  };
                } else if (settings.animationPattern === 'spiral') {
                  updates.patterns = {
                    spiral: {
                      photoCount: value
                    }
                  };
                }
                
                onSettingsChange(updates);
              }}
              className="w-full bg-gray-800"
            />
            <p className="mt-1 text-xs text-gray-400">
              Number of photos to display simultaneously
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Photo Size
              <span className="ml-2 text-xs text-gray-400">{settings.photoSize.toFixed(1)} units</span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={settings.photoSize}
              onChange={(e) => onSettingsChange({ 
                photoSize: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
            <p className="mt-1 text-xs text-gray-400">
              Photo size multiplier (1 = small, 20 = huge)
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Photo Brightness
              <span className="ml-2 text-xs text-gray-400">{(settings.photoBrightness * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={settings.photoBrightness}
              onChange={(e) => onSettingsChange({ 
                photoBrightness: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
            <p className="mt-1 text-xs text-gray-400">
              Adjust photo brightness independently (10% = very dark, 300% = very bright)
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Empty Slot Color
            </label>
            <input
              type="color"
              value={settings.emptySlotColor}
              onChange={(e) => onSettingsChange({ 
                emptySlotColor: e.target.value 
              }, true)}
              className="w-full h-8 rounded cursor-pointer bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Grid Wall Settings - Only show when grid pattern is selected */}
      {settings.animationPattern === 'grid' && (
        <div>
          <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
            <Grid className="h-4 w-4 mr-2" />
            {settings.animationPattern === 'grid' ? 'Grid Wall Settings' : 'Pattern Settings'}
          </h4>
          
          <div className="space-y-4">
            {settings.animationPattern === 'grid' && (
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Wall Height
                  <span className="ml-2 text-xs text-gray-400">{settings.patterns.grid.wallHeight.toFixed(1)} units</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={settings.patterns.grid.wallHeight}
                  onChange={(e) => onSettingsChange({ 
                    patterns: {
                      grid: {
                        wallHeight: parseFloat(e.target.value)
                      }
                    }
                  }, true)}
                  className="w-full bg-gray-800"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Adjust the vertical position of the photo wall
                </p>
              </div>
            )}

            {settings.animationPattern === 'grid' && (
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Photo Spacing
                  <span className="ml-2 text-xs text-gray-400">
                    {settings.patterns.grid.spacing === 0 ? 'Solid Wall' : `${(settings.patterns.grid.spacing * 200).toFixed(0)}% gaps`}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.patterns.grid.spacing}
                  onChange={(e) => onSettingsChange({ 
                    patterns: {
                      grid: {
                        spacing: parseFloat(e.target.value)
                      }
                    }
                  }, true)}
                  className="w-full bg-gray-800"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {settings.patterns.grid.spacing === 0 
                    ? '🧱 Edge-to-edge solid wall (no gaps)'
                    : settings.patterns.grid.spacing < 0.5
                    ? '📐 Small gaps between photos'
                    : '🎯 Large gaps between photos'
                  }
                </p>
              </div>
            )}

            {settings.animationPattern === 'float' && (
              <>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Float Height
                    <span className="ml-2 text-xs text-gray-400">{settings.patterns.float.height.toFixed(1)} units</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={settings.patterns.float.height}
                    onChange={(e) => onSettingsChange({ 
                      patterns: {
                        float: {
                          height: parseFloat(e.target.value)
                        }
                      }
                    }, true)}
                    className="w-full bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Maximum height photos will float to before recycling
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Spread Distance
                    <span className="ml-2 text-xs text-gray-400">{settings.patterns.float.spread.toFixed(1)} units</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={settings.patterns.float.spread}
                    onChange={(e) => onSettingsChange({ 
                      patterns: {
                        float: {
                          spread: parseFloat(e.target.value)
                        }
                      }
                    }, true)}
                    className="w-full bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    How far apart photos are spread horizontally
                  </p>
                </div>
              </>
            )}

            {settings.animationPattern === 'wave' && (
              <>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Wave Amplitude
                    <span className="ml-2 text-xs text-gray-400">{settings.patterns.wave.amplitude.toFixed(1)} units</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={settings.patterns.wave.amplitude}
                    onChange={(e) => onSettingsChange({ 
                      patterns: {
                        wave: {
                          amplitude: parseFloat(e.target.value)
                        }
                      }
                    }, true)}
                    className="w-full bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Height of the wave peaks
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Wave Frequency
                    <span className="ml-2 text-xs text-gray-400">{settings.patterns.wave.frequency.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.05"
                    value={settings.patterns.wave.frequency}
                    onChange={(e) => onSettingsChange({ 
                      patterns: {
                        wave: {
                          frequency: parseFloat(e.target.value)
                        }
                      }
                    }, true)}
                    className="w-full bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    How close together the wave peaks are
                  </p>
                </div>
              </>
            )}

            {settings.animationPattern === 'spiral' && (
              <>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Spiral Radius
                    <span className="ml-2 text-xs text-gray-400">{settings.patterns.spiral.radius.toFixed(1)} units</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={settings.patterns.spiral.radius}
                    onChange={(e) => onSettingsChange({ 
                      patterns: {
                        spiral: {
                          radius: parseFloat(e.target.value)
                        }
                      }
                    }, true)}
                    className="w-full bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Width of the spiral
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Height Step
                    <span className="ml-2 text-xs text-gray-400">{settings.patterns.spiral.heightStep.toFixed(2)} units</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={settings.patterns.spiral.heightStep}
                    onChange={(e) => onSettingsChange({ 
                      patterns: {
                        spiral: {
                          heightStep: parseFloat(e.target.value)
                        }
                      }
                    }, true)}
                    className="w-full bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Vertical spacing between spiral layers
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Grid Aspect Ratio Preset
              </label>
              <select
                value={settings.gridAspectRatioPreset}
                onChange={(e) => {
                  const preset = e.target.value as SceneSettings['gridAspectRatioPreset'];
                  let ratio = settings.gridAspectRatio;
                  
                  switch (preset) {
                    case '1:1': ratio = 1; break;
                    case '4:3': ratio = 1.333333; break;
                    case '16:9': ratio = 1.777778; break;
                    case '21:9': ratio = 2.333333; break;
                    case 'custom': break;
                  }
                  
                  if (settings.animationPattern === 'grid') {
                    onSettingsChange({
                      gridAspectRatioPreset: preset,
                      gridAspectRatio: ratio,
                      patterns: {
                        grid: {
                          aspectRatio: ratio
                        }
                      }
                    });
                  } else {
                    onSettingsChange({
                      gridAspectRatioPreset: preset,
                      gridAspectRatio: ratio
                    });
                  }
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
              >
                <option value="1:1">Square (1:1)</option>
                <option value="4:3">Standard (4:3)</option>
                <option value="16:9">Widescreen (16:9)</option>
                <option value="21:9">Ultrawide (21:9)</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {settings.gridAspectRatioPreset === 'custom' && (
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Custom Aspect Ratio
                  <span className="ml-2 text-xs text-gray-400">{settings.gridAspectRatio.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={settings.gridAspectRatio}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (settings.animationPattern === 'grid') {
                      onSettingsChange({ 
                        gridAspectRatio: value,
                        patterns: {
                          grid: {
                            aspectRatio: value
                          }
                        }
                      });
                    } else {
                      onSettingsChange({ 
                        gridAspectRatio: value
                      });
                    }
                  }}
                  className="w-full bg-gray-800"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camera Animation Controls */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Camera className="h-4 w-4 mr-2" />
          Camera Animation
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.cameraAnimation.enabled}
              onChange={(e) => onSettingsChange({ 
                cameraAnimation: { ...settings.cameraAnimation, enabled: e.target.checked }
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">Enable Camera Animation</label>
          </div>

          {settings.cameraAnimation.enabled && (
            <>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Animation Type</label>
                <select
                  value={settings.cameraAnimation.type}
                  onChange={(e) => onSettingsChange({ 
                    cameraAnimation: { ...settings.cameraAnimation, type: e.target.value as any }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                >
                  <option value="none">None</option>
                  <option value="figure8">Figure-8 (Recommended for Float)</option>
                  <option value="centerRotate">Center Focus</option>
                  <option value="orbit">Orbit</option>
                  <option value="wave">Wave</option>
                  <option value="spiral">Spiral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Speed: {settings.cameraAnimation.speed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={settings.cameraAnimation.speed}
                  onChange={(e) => onSettingsChange({ 
                    cameraAnimation: { ...settings.cameraAnimation, speed: parseFloat(e.target.value) }
                  })}
                  className="w-full bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Radius: {settings.cameraAnimation.radius.toFixed(0)} units
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="1"
                  value={settings.cameraAnimation.radius}
                  onChange={(e) => onSettingsChange({ 
                    cameraAnimation: { ...settings.cameraAnimation, radius: parseFloat(e.target.value) }
                  })}
                  className="w-full bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Height: {settings.cameraAnimation.height.toFixed(0)} units
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={settings.cameraAnimation.height}
                  onChange={(e) => onSettingsChange({ 
                    cameraAnimation: { ...settings.cameraAnimation, height: parseFloat(e.target.value) }
                  })}
                  className="w-full bg-gray-800"
                />
              </div>

              {(settings.cameraAnimation.type === 'wave' || 
                settings.cameraAnimation.type === 'figure8' || 
                settings.cameraAnimation.type === 'spiral') && (
                <>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Amplitude: {settings.cameraAnimation.amplitude.toFixed(0)} units
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={settings.cameraAnimation.amplitude}
                      onChange={(e) => onSettingsChange({ 
                        cameraAnimation: { ...settings.cameraAnimation, amplitude: parseFloat(e.target.value) }
                      })}
                      className="w-full bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Frequency: {settings.cameraAnimation.frequency.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={settings.cameraAnimation.frequency}
                      onChange={(e) => onSettingsChange({ 
                        cameraAnimation: { ...settings.cameraAnimation, frequency: parseFloat(e.target.value) }
                      })}
                      className="w-full bg-gray-800"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Photo Rotation */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <RotateCw className="h-4 w-4 mr-2" />
          Photo Behavior
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.photoRotation}
              onChange={(e) => onSettingsChange({ 
                photoRotation: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Enable Photo Rotation
            </label>
          </div>
          
          <p className="text-xs text-gray-400">
            {settings.animationPattern === 'grid' 
              ? "Grid Wall: Turn OFF for traditional flat wall, turn ON for billboard effect" 
              : "When enabled, photos rotate to always face the camera for better visibility"
            }
          </p>
        </div>
      </div>

      {/* Camera Controls */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <CameraIcon className="h-4 w-4 mr-2" />
          Camera
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.cameraEnabled}
              onChange={(e) => onSettingsChange({ 
                cameraEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Enable Camera Movement
            </label>
          </div>

          {settings.cameraEnabled && (
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.cameraRotationEnabled}
                  onChange={(e) => onSettingsChange({ 
                    cameraRotationEnabled: e.target.checked 
                  })}
                  className="mr-2 bg-gray-800 border-gray-700"
                />
                <label className="text-sm text-gray-300">
                  Auto Rotate
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Camera Distance
                  <span className="ml-2 text-xs text-gray-400">{settings.cameraDistance} units</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={settings.cameraDistance}
                  onChange={(e) => onSettingsChange({ 
                    cameraDistance: parseFloat(e.target.value) 
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Camera Height
                  <span className="ml-2 text-xs text-gray-400">{settings.cameraHeight} units</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={settings.cameraHeight}
                  onChange={(e) => onSettingsChange({ 
                    cameraHeight: parseFloat(e.target.value) 
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>

              {settings.cameraRotationEnabled && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Rotation Speed
                    <span className="ml-2 text-xs text-gray-400">{settings.cameraRotationSpeed.toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={settings.cameraRotationSpeed}
                    onChange={(e) => onSettingsChange({ 
                      cameraRotationSpeed: parseFloat(e.target.value) 
                    }, true)}
                    className="w-full bg-gray-800"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lighting Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Lightbulb className="h-4 w-4 mr-2" />
          Lighting
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Ambient Light
              <span className="ml-2 text-xs text-gray-400">{(settings.ambientLightIntensity * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.2"
              value={settings.ambientLightIntensity}
              onChange={(e) => onSettingsChange({ 
                ambientLightIntensity: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
            <p className="mt-1 text-xs text-gray-400">
              Global scene brightness (0% = pitch black, 1000% = very bright)
            </p>
          </div>
        </div>
      </div>

      {/* Spotlight Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Sun className="h-4 w-4 mr-2" />
          Spotlights
        </h4>
        
        <div className="space-y-4">
          <div className="bg-gray-800 p-3 rounded">
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Spotlight Color</label>
                <input
                  type="color"
                  value={settings.spotlightColor}
                  onChange={(e) => onSettingsChange({ 
                    spotlightColor: e.target.value 
                  }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Number of Spotlights
                  <span className="ml-2 text-xs text-gray-400">{settings.spotlightCount}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={settings.spotlightCount}
                  onChange={(e) => onSettingsChange({ 
                    spotlightCount: parseInt(e.target.value) 
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Spotlight Height
              <span className="ml-2 text-xs text-gray-400">{settings.spotlightHeight} units</span>
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={settings.spotlightHeight}
              onChange={(e) => onSettingsChange({ 
                spotlightHeight: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Spotlight Distance
              <span className="ml-2 text-xs text-gray-400">{settings.spotlightDistance} units</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={settings.spotlightDistance}
              onChange={(e) => onSettingsChange({ 
                spotlightDistance: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Spotlight Intensity
              <span className="ml-2 text-xs text-gray-400">{settings.spotlightIntensity.toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="200"
              step="1"
              value={settings.spotlightIntensity}
              onChange={(e) => onSettingsChange({ 
                spotlightIntensity: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Spotlight Angle
              <span className="ml-2 text-xs text-gray-400">{settings.spotlightAngle.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              value={settings.spotlightAngle}
              onChange={(e) => onSettingsChange({ 
                spotlightAngle: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
            <p className="mt-1 text-xs text-gray-400">
              Controls the beam spread angle (0.1 = narrow beam, 1.5 = wide beam)
            </p>
          </div>
        </div>
      </div>

      {/* Floor Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Square className="h-4 w-4 mr-2" />
          Floor & Grid
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.floorEnabled}
              onChange={(e) => onSettingsChange({ 
                floorEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Show Floor
            </label>
          </div>

          {settings.floorEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Floor Color</label>
                <input
                  type="color"
                  value={settings.floorColor}
                  onChange={(e) => onSettingsChange({ 
                    floorColor: e.target.value 
                  }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Floor Size
                  <span className="ml-2 text-xs text-gray-400">{settings.floorSize} units</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={settings.floorSize}
                  onChange={(e) => onSettingsChange({ floorSize: parseFloat(e.target.value) }, true)}
                  className="w-full bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Floor Opacity
                  <span className="ml-2 text-xs text-gray-400">{Math.round(settings.floorOpacity * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.floorOpacity}
                  onChange={(e) => onSettingsChange({
                    floorOpacity: parseFloat(e.target.value)
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.gridEnabled}
              onChange={(e) => onSettingsChange({ 
                gridEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Show Grid Lines
            </label>
          </div>

          {settings.gridEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Grid Color</label>
                <input
                  type="color"
                  value={settings.gridColor}
                  onChange={(e) => onSettingsChange({ 
                    gridColor: e.target.value 
                  }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Grid Size
                  <span className="ml-2 text-xs text-gray-400">{settings.gridSize} units</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={settings.gridSize}
                  onChange={(e) => onSettingsChange({ gridSize: parseFloat(e.target.value) }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Grid Divisions
                  <span className="ml-2 text-xs text-gray-400">{Math.round(settings.gridDivisions)} lines</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={settings.gridDivisions}
                  onChange={(e) => onSettingsChange({
                    gridDivisions: parseFloat(e.target.value)
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Grid Opacity
                  <span className="ml-2 text-xs text-gray-400">{Math.round(settings.gridOpacity * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.gridOpacity}
                  onChange={(e) => onSettingsChange({
                    gridOpacity: parseFloat(e.target.value)
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Background Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Palette className="h-4 w-4 mr-2" />
          Background
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.backgroundGradient}
              onChange={(e) => onSettingsChange({ 
                backgroundGradient: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Use Gradient Background
            </label>
          </div>

          {!settings.backgroundGradient ? (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Background Color</label>
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => onSettingsChange({ 
                  backgroundColor: e.target.value 
                }, true)}
                className="w-full h-8 rounded cursor-pointer bg-gray-800"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Gradient Start</label>
                <input
                  type="color"
                  value={settings.backgroundGradientStart}
                  onChange={(e) => onSettingsChange({ 
                    backgroundGradientStart: e.target.value 
                  }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Gradient End</label>
                <input
                  type="color"
                  value={settings.backgroundGradientEnd}
                  onChange={(e) => onSettingsChange({ 
                    backgroundGradientEnd: e.target.value 
                  }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Gradient Angle
                  <span className="ml-2 text-xs text-gray-400">{settings.backgroundGradientAngle}°</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={settings.backgroundGradientAngle}
                  onChange={(e) => onSettingsChange({ 
                    backgroundGradientAngle: parseInt(e.target.value) 
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Particle System Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Sparkles className="h-4 w-4 mr-2" />
          Particle Effects
        </h4>
        
        <div className="space-y-4">
          {/* Enable/Disable Particles */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.particles?.enabled ?? true}
              onChange={(e) => onSettingsChange({
                particles: {
                  ...settings.particles,
                  enabled: e.target.checked
                }
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Enable Particle Effects
            </label>
          </div>

          {settings.particles?.enabled && (
            <div className="space-y-4">
              {/* Particle Theme Selector */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Particle Theme
                </label>
                <select
                  value={settings.particles?.theme ?? 'Purple Magic'}
                  onChange={(e) => onSettingsChange({
                    particles: {
                      ...settings.particles,
                      theme: e.target.value
                    }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                >
                  {PARTICLE_THEMES.map((theme) => (
                    <option key={theme.name} value={theme.name}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Particle Intensity */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Particle Intensity
                  <span className="ml-2 text-xs text-gray-400">
                    {Math.round((settings.particles?.intensity ?? 0.7) * 100)}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.particles?.intensity ?? 0.7}
                  onChange={(e) => onSettingsChange({
                    particles: {
                      ...settings.particles,
                      intensity: parseFloat(e.target.value)
                    }
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>

              {/* Theme Preview */}
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-xs text-gray-400 mb-2">Preview Colors:</div>
                <div className="flex space-x-2">
                  {PARTICLE_THEMES.find(t => t.name === (settings.particles?.theme ?? 'Purple Magic')) && (
                    <>
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-600"
                        style={{ 
                          backgroundColor: PARTICLE_THEMES.find(t => t.name === (settings.particles?.theme ?? 'Purple Magic'))?.primary 
                        }}
                        title="Primary"
                      />
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-600"
                        style={{ 
                          backgroundColor: PARTICLE_THEMES.find(t => t.name === (settings.particles?.theme ?? 'Purple Magic'))?.secondary 
                        }}
                        title="Secondary"
                      />
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-600"
                        style={{ 
                          backgroundColor: PARTICLE_THEMES.find(t => t.name === (settings.particles?.theme ?? 'Purple Magic'))?.accent 
                        }}
                        title="Accent"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Button */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={onReset}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm"
        >
          Reset All Settings
        </button>
      </div>
    </div>
  );
};

export default SceneSettings;