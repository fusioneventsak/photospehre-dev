/*
  # Fix Pattern Settings Persistence
  
  1. Changes
    - Updates the default collage settings function to include pattern-specific photo counts
    - Adds photoCount property to each pattern in the patterns object
    - Updates existing collage settings to include pattern-specific photo counts
    - Ensures each pattern maintains its own settings when switching between patterns
  
  2. Benefits
    - Each animation pattern can have its own photo count (e.g., 50 for grid, 400 for float)
    - Settings are properly persisted when switching between patterns
    - Improves user experience by remembering pattern-specific configurations
*/

-- Update the default collage settings function with pattern-specific photo counts
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
          "wallHeight": 0,
          "photoCount": 50
        },
        "float": {
          "enabled": false,
          "spacing": 0.1,
          "height": 60,
          "spread": 25,
          "photoCount": 100
        },
        "wave": {
          "enabled": false,
          "spacing": 0.15,
          "amplitude": 15,
          "frequency": 0.3,
          "photoCount": 75
        },
        "spiral": {
          "enabled": false,
          "spacing": 0.1,
          "radius": 20,
          "heightStep": 0.5,
          "photoCount": 150
        }
      }
    }'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Add photoCount to each pattern in existing collage settings
DO $$
DECLARE
  setting_record RECORD;
BEGIN
  FOR setting_record IN SELECT id, settings FROM collage_settings LOOP
    -- Add photoCount to grid pattern if it doesn't exist
    IF setting_record.settings->'patterns'->'grid' IS NOT NULL AND 
       (setting_record.settings->'patterns'->'grid'->'photoCount') IS NULL THEN
      UPDATE collage_settings
      SET settings = jsonb_set(
        settings,
        '{patterns,grid,photoCount}',
        COALESCE(settings->>'photoCount', '50')::jsonb
      )
      WHERE id = setting_record.id;
    END IF;
    
    -- Add photoCount to float pattern if it doesn't exist
    IF setting_record.settings->'patterns'->'float' IS NOT NULL AND 
       (setting_record.settings->'patterns'->'float'->'photoCount') IS NULL THEN
      UPDATE collage_settings
      SET settings = jsonb_set(
        settings,
        '{patterns,float,photoCount}',
        '100'::jsonb
      )
      WHERE id = setting_record.id;
    END IF;
    
    -- Add photoCount to wave pattern if it doesn't exist
    IF setting_record.settings->'patterns'->'wave' IS NOT NULL AND 
       (setting_record.settings->'patterns'->'wave'->'photoCount') IS NULL THEN
      UPDATE collage_settings
      SET settings = jsonb_set(
        settings,
        '{patterns,wave,photoCount}',
        '75'::jsonb
      )
      WHERE id = setting_record.id;
    END IF;
    
    -- Add photoCount to spiral pattern if it doesn't exist
    IF setting_record.settings->'patterns'->'spiral' IS NOT NULL AND 
       (setting_record.settings->'patterns'->'spiral'->'photoCount') IS NULL THEN
      UPDATE collage_settings
      SET settings = jsonb_set(
        settings,
        '{patterns,spiral,photoCount}',
        '150'::jsonb
      )
      WHERE id = setting_record.id;
    END IF;
  END LOOP;
END $$;