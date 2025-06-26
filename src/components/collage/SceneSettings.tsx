import React from 'react';
import { type SceneSettings } from '../../store/sceneStore';
import { Grid, Palette, CameraIcon, ImageIcon, Square, Sun, Lightbulb, RotateCw, Move, Eye, Video, Clapperboard, Gamepad2 } from 'lucide-react';

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
              <span className="ml-2 text-xs text-gray-400">
                {settings.animationPattern === 'float' ? 'Float' : 
                 settings.animationPattern === 'wave' ? 'Wave' : 
                 settings.animationPattern === 'spiral' ? 'Spiral' : 'Grid'}
              </span>
            </label>
            <select
              value={settings.animationPattern}
              onChange={(e) => {
                const newPattern = e.target.value as 'float' | 'wave' | 'spiral' | 'grid';
                
                // CRITICAL: Always enable animation and set appropriate speeds
                const patternDefaults = {
                  grid: { speed: 30, photoCount: 50 },
                  float: { speed: 70, photoCount: 100 },
                  wave: { speed: 50, photoCount: 75 },
                  spiral: { speed: 40, photoCount: 60 }
                };
                
                const defaults = patternDefaults[newPattern];
                
                onSettingsChange({ 
                  animationPattern: newPattern as 'float' | 'wave' | 'spiral' | 'grid',
                  animationEnabled: true, // ALWAYS enable
                  animationSpeed: defaults.speed,
                  photoCount: defaults.photoCount,
                  // Update pattern-specific settings
                  patterns: {
                    ...settings.patterns,
                    [newPattern]: {
                      ...settings.patterns?.[newPattern],
                      photoCount: defaults.photoCount,
                      enabled: true
                    }
                  }
                });
              }}
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
                Pattern Animation Speed
                <span className="ml-2 text-xs text-gray-400">
                  {settings.animationSpeed}% 
                  {settings.animationPattern === 'float' && settings.animationSpeed < 50 && 
                    " (Recommended: 70%+ for float pattern)"}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={settings.animationSpeed}
                onChange={(e) => {
                  const speed = parseFloat(e.target.value);
                  onSettingsChange({ 
                    animationSpeed: speed
                  });
                }}
                className="w-full bg-gray-800"
              />
              <p className="mt-1 text-xs text-gray-400">
                <strong>Pattern speed only</strong> - controls how fast photos move in animation patterns 
                (does NOT affect camera movement)
              </p>
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
          Camera Mode
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Camera Mode
            </label>
            <select
              value={settings.cameraMode || 'orbit'}
              onChange={(e) => onSettingsChange({ 
                cameraMode: e.target.value as 'orbit' | 'firstPerson' | 'cinematic' | 'auto'
              })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
            >
              <option value="orbit">Orbit (Interactive)</option>
              <option value="firstPerson">First Person</option>
              <option value="cinematic">Cinematic Path</option>
              <option value="auto">Auto (Best Views)</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.autoViewEnabled}
              onChange={(e) => onSettingsChange({ 
                autoViewEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Enable Auto Best View
            </label>
          </div>

          {settings.cameraMode === 'cinematic' && (
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <h5 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Clapperboard className="h-3 w-3 mr-1" />
                Cinematic Path Settings
              </h5>
              <p className="text-xs text-gray-400 mb-3">
                The camera will automatically follow an optimal path around your photos.
              </p>
              <button
                onClick={() => onSettingsChange({ 
                  cameraKeyframes: [] // This will trigger regeneration
                })}
                className="w-full px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
              >
                Regenerate Camera Path
              </button>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.vrModeEnabled}
              onChange={(e) => onSettingsChange({ 
                vrModeEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300 flex items-center">
              <Gamepad2 className="h-3 w-3 mr-1" />
              VR Compatible Mode
            </label>
          </div>
        </div>
      </div>

      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <CameraIcon className="h-4 w-4 mr-2" />
          Camera
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Camera Control Speed
              <span className="ml-2 text-xs text-gray-400">{settings.cameraRotationSpeed?.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={settings.cameraRotationSpeed || 1.0}
              onChange={(e) => onSettingsChange({ 
                cameraRotationSpeed: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
            <p className="text-xs text-gray-400 mt-1">
              <strong>Camera speed only</strong> - controls camera rotation, zoom, pan, and cinematic movement speed 
              (completely separate from pattern animation speed)
            </p>
          </div>

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
              Auto-Rotate in Orbit Mode
            </label>
            <p className="text-xs text-gray-400 ml-2">
              (Automatically rotates camera around the scene when not interacting)
            </p>
          </div>
        </div>

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
          <Sun className="h-4 w-4 mr-2" />
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
              max="2"
              step="0.1"
              value={settings.ambientLightIntensity}
              onChange={(e) => onSettingsChange({ 
                ambientLightIntensity: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Directional Light
              <span className="ml-2 text-xs text-gray-400">{(settings.directionalLightIntensity * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={settings.directionalLightIntensity}
              onChange={(e) => onSettingsChange({ 
                directionalLightIntensity: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Light Color
            </label>
            <input
              type="color"
              value={settings.lightColor}
              onChange={(e) => onSettingsChange({ 
                lightColor: e.target.value 
              }, true)}
              className="w-full h-8 rounded cursor-pointer bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Environment Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Palette className="h-4 w-4 mr-2" />
          Environment
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Background Color
            </label>
            <input
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => onSettingsChange({ 
                backgroundColor: e.target.value 
              }, true)}
              className="w-full h-8 rounded cursor-pointer bg-gray-800"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.fogEnabled}
              onChange={(e) => onSettingsChange({ 
                fogEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Enable Fog
            </label>
          </div>

          {settings.fogEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Fog Density
                  <span className="ml-2 text-xs text-gray-400">{(settings.fogDensity * 1000).toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.1"
                  step="0.001"
                  value={settings.fogDensity}
                  onChange={(e) => onSettingsChange({ 
                    fogDensity: parseFloat(e.target.value) 
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Fog Color
                </label>
                <input
                  type="color"
                  value={settings.fogColor}
                  onChange={(e) => onSettingsChange({ 
                    fogColor: e.target.value 
                  }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Button */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={onReset}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default SceneSettings;