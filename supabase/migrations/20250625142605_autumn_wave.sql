/*
  # Improve Default Scene Lighting and Visibility
  
  1. Changes
    - Change empty slot color from dark gray (#1A1A1A) to red (#FF3333)
    - Increase ambient light intensity from 0.3 to 0.6
    - Increase spotlight intensity from 400.0 to 600.0
    - Increase spotlight count from 2 to 3
    - Add more spotlights for better scene coverage
    - Adjust spotlight positions for better illumination
    
  2. Benefits
    - Better visibility of empty slots with contrasting red color
    - Brighter overall scene with improved lighting
    - More even illumination across the entire scene
    - Better user experience for first-time users
*/

-- Update the default collage settings function with improved lighting
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
      "photoBrightness": 1.0,
      "patterns": {
        "grid": {
          "enabled": true,
          "animationSpeed": 1.0,
          "spacing": 0.1,
          "aspectRatio": 1.77778,
          "wallHeight": 0
        },
        "float": {
          "enabled": false,
          "animationSpeed": 1.0,
          "spacing": 0.1,
          "height": 30,
          "spread": 25
        },
        "wave": {
          "enabled": false,
          "animationSpeed": 1.0,
          "spacing": 0.15,
          "amplitude": 5,
          "frequency": 0.5
        },
        "spiral": {
          "enabled": false,
          "animationSpeed": 1.0,
          "spacing": 0.1,
          "radius": 15,
          "heightStep": 0.5
        }
      }
    }'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Update existing collage settings with improved lighting
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