/*
  # Update Default Collage Settings with Pattern-Specific Properties
  
  1. Changes
    - Updates the default collage settings function to include pattern-specific properties
    - Ensures each animation pattern has its own settings that persist when switching patterns
    - Improves lighting and visual appearance with better defaults
    
  2. Benefits
    - Users can customize each pattern independently
    - Settings are preserved when switching between patterns
    - Better default visual appearance with improved lighting
*/

-- Update the default collage settings function with pattern-specific properties
CREATE OR REPLACE FUNCTION create_default_collage_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO collage_settings (collage_id, settings)
  VALUES (
    NEW.id,
    '{
      "gridSize": 200,
      "floorSize": 200,
      "gridColor": "#444444",
      "photoSize": 4.0,
      "floorColor": "#1A1A1A",
      "photoCount": 50,
      "wallHeight": 0,
      "gridEnabled": true,
      "gridOpacity": 1.0,
      "cameraHeight": 10,
      "floorEnabled": true,
      "floorOpacity": 0.8,
      "photoSpacing": 0,
      "cameraEnabled": true,
      "gridDivisions": 30,
      "animationSpeed": 50,
      "cameraDistance": 25,
      "emptySlotColor": "#FF3333",
      "floorMetalness": 0.7,
      "floorRoughness": 0.2,
      "spotlightAngle": 1.2566370614359172,
      "spotlightColor": "#ffffff",
      "spotlightCount": 3,
      "spotlightWidth": 1.8,
      "backgroundColor": "#000000",
      "gridAspectRatio": 1.77778,
      "spotlightHeight": 35,
      "animationEnabled": false,
      "animationPattern": "grid",
      "photoRotation": true,
      "floorReflectivity": 0.8,
      "spotlightDistance": 60,
      "spotlightPenumbra": 1.2,
      "backgroundGradient": false,
      "spotlightIntensity": 600.0,
      "cameraRotationSpeed": 0.2,
      "ambientLightIntensity": 0.6,
      "backgroundGradientEnd": "#1a1a1a",
      "cameraRotationEnabled": true,
      "backgroundGradientAngle": 180,
      "backgroundGradientStart": "#000000",
      "photoBrightness": 1.2,
      "patterns": {
        "grid": {
          "enabled": true,
          "spacing": 0.1,
          "aspectRatio": 1.77778,
          "wallHeight": 0
        },
        "float": {
          "enabled": false,
          "spacing": 0.1,
          "height": 60,
          "spread": 25
        },
        "wave": {
          "enabled": false,
          "spacing": 0.15,
          "amplitude": 15,
          "frequency": 0.3
        },
        "spiral": {
          "enabled": false,
          "spacing": 0.1,
          "radius": 20,
          "heightStep": 0.5
        }
      }
    }'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Update existing collage settings to include pattern-specific properties
-- This preserves existing settings while adding the new pattern structure
UPDATE collage_settings 
SET settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          settings,
          '{emptySlotColor}',
          '"#FF3333"'
        ),
        '{ambientLightIntensity}',
        '0.6'
      ),
      '{spotlightIntensity}',
      '600.0'
    ),
    '{spotlightCount}',
    '3'
  ),
  '{photoBrightness}',
  '1.2'
);

-- Add patterns object to existing settings if it doesn't exist
UPDATE collage_settings
SET settings = jsonb_set(
  settings,
  '{patterns}',
  '{
    "grid": {
      "enabled": true,
      "spacing": 0.1,
      "aspectRatio": 1.77778,
      "wallHeight": 0
    },
    "float": {
      "enabled": false,
      "spacing": 0.1,
      "height": 60,
      "spread": 25
    },
    "wave": {
      "enabled": false,
      "spacing": 0.15,
      "amplitude": 15,
      "frequency": 0.3
    },
    "spiral": {
      "enabled": false,
      "spacing": 0.1,
      "radius": 20,
      "heightStep": 0.5
    }
  }'::jsonb
)
WHERE NOT settings ? 'patterns';

-- Sync pattern-specific properties with top-level properties for existing settings
DO $$
DECLARE
  setting_record RECORD;
BEGIN
  FOR setting_record IN SELECT id, settings FROM collage_settings LOOP
    -- For grid pattern
    IF setting_record.settings->>'animationPattern' = 'grid' THEN
      UPDATE collage_settings
      SET settings = jsonb_set(
        settings,
        '{patterns,grid}',
        jsonb_build_object(
          'enabled', true,
          'spacing', COALESCE((settings->>'photoSpacing')::numeric, 0.1),
          'aspectRatio', COALESCE((settings->>'gridAspectRatio')::numeric, 1.77778),
          'wallHeight', COALESCE((settings->>'wallHeight')::numeric, 0)
        )
      )
      WHERE id = setting_record.id;
    END IF;
  END LOOP;
END $$;