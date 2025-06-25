/*
  # Initial Database Schema
  
  1. Tables
    - collages: Stores collage metadata
    - photos: Stores photo references
    - collage_settings: Stores 3D scene configuration
    - stock_photos: Stores stock photo references
    - users: Links to auth.users
    - user_roles: Role management
    - settings: Global app settings
    - sound_settings: User sound preferences
    - images: Image management
  
  2. Security
    - RLS enabled on all tables
    - Policies for public and authenticated access
    - Storage bucket for photo uploads
*/

-- 1. Create collages table
CREATE TABLE IF NOT EXISTS collages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collage_id uuid NOT NULL REFERENCES collages(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Create collage_settings table
CREATE TABLE IF NOT EXISTS collage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collage_id uuid NOT NULL REFERENCES collages(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create stock_photos table
CREATE TABLE IF NOT EXISTS stock_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 5. Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 7. Create settings table (global app settings)
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_color text DEFAULT '#8b5cf6' NOT NULL,
  secondary_color text DEFAULT '#14b8a6' NOT NULL,
  logo_url text,
  background_url text,
  grid_size integer DEFAULT 4 NOT NULL,
  gamification_enabled boolean DEFAULT true NOT NULL,
  sponsor_logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Create sound_settings table
CREATE TABLE IF NOT EXISTS sound_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  volume float DEFAULT 1.0,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. Create images table
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  alt_text text,
  section text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS collages_code_idx ON collages(code);
CREATE INDEX IF NOT EXISTS collages_user_id_idx ON collages(user_id);
CREATE INDEX IF NOT EXISTS photos_collage_id_idx ON photos(collage_id);
CREATE INDEX IF NOT EXISTS collage_settings_collage_id_idx ON collage_settings(collage_id);
CREATE UNIQUE INDEX IF NOT EXISTS collage_settings_collage_id_key ON collage_settings(collage_id);

-- Create storage bucket for photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'photos',
    'photos',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];

-- Enable Row Level Security
ALTER TABLE collages ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE collage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sound_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Create policies for collages table
CREATE POLICY "Anyone can view collages"
  ON collages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create collages"
  ON collages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update collages"
  ON collages FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete collages"
  ON collages FOR DELETE
  TO public
  USING (true);

-- Create policies for photos table
CREATE POLICY "photos_completely_open" 
  ON photos 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);

-- Create policies for collage_settings table
CREATE POLICY "collage_settings_completely_open" 
  ON collage_settings 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);

-- Create policies for stock_photos table
CREATE POLICY "Anyone can view stock photos"
  ON stock_photos FOR SELECT
  TO public
  USING (true);

-- Create policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for user_roles table
CREATE POLICY "user_roles_select_policy"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own roles OR admins can see all roles
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles admin_role
      WHERE admin_role.user_id = auth.uid()
      AND admin_role.role = 'admin'
    )
  );

-- Create policies for settings table
CREATE POLICY "settings_completely_open" 
  ON settings 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);

-- Create policies for sound_settings table
CREATE POLICY "Users can manage their own sound settings"
  ON sound_settings
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for images table
CREATE POLICY "images_completely_open" 
  ON images 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);

-- Create storage policies
CREATE POLICY "Anyone can upload photos"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'photos');

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for collage_settings
CREATE TRIGGER update_collage_settings_updated_at
  BEFORE UPDATE ON collage_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function for default collage settings
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
      "emptySlotColor": "#1A1A1A",
      "floorMetalness": 0.7,
      "floorRoughness": 0.2,
      "spotlightAngle": 1.2566370614359172,
      "spotlightColor": "#ffffff",
      "spotlightCount": 2,
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
      "spotlightIntensity": 400.0,
      "cameraRotationSpeed": 0.2,
      "ambientLightIntensity": 0.3,
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

-- Create trigger for default collage settings
CREATE TRIGGER create_collage_settings
  AFTER INSERT ON collages
  FOR EACH ROW
  EXECUTE FUNCTION create_default_collage_settings();

-- Insert some sample stock photos
INSERT INTO stock_photos (url, category)
VALUES
  ('https://images.pexels.com/photos/1839564/pexels-photo-1839564.jpeg', 'people'),
  ('https://images.pexels.com/photos/2896853/pexels-photo-2896853.jpeg', 'people'),
  ('https://images.pexels.com/photos/3876394/pexels-photo-3876394.jpeg', 'people'),
  ('https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg', 'people'),
  ('https://images.pexels.com/photos/3812207/pexels-photo-3812207.jpeg', 'people'),
  ('https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg', 'landscape'),
  ('https://images.pexels.com/photos/1366630/pexels-photo-1366630.jpeg', 'landscape'),
  ('https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg', 'landscape'),
  ('https://images.pexels.com/photos/1386604/pexels-photo-1386604.jpeg', 'landscape'),
  ('https://images.pexels.com/photos/1327354/pexels-photo-1327354.jpeg', 'landscape')
ON CONFLICT DO NOTHING;