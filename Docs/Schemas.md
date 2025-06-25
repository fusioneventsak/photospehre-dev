# Database Schemas

## Core Tables

### collages

```sql
CREATE TABLE collages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT code_format CHECK (code ~ '^[A-Z0-9]{4}$')
);

CREATE INDEX collages_code_idx ON collages(code);
CREATE INDEX collages_user_id_idx ON collages(user_id);
```

The `collages` table stores information about each 3D photo collage. Each collage has:
- A unique ID
- A 4-character alphanumeric code for easy sharing
- A name
- An optional user_id (can be null for anonymous collages)
- A creation timestamp

The `code_format` constraint ensures that codes are exactly 4 characters and contain only uppercase letters and numbers.

### photos

```sql
CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collage_id uuid NOT NULL REFERENCES collages(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX photos_collage_id_idx ON photos(collage_id);
```

The `photos` table stores references to uploaded photos:
- Each photo has a unique ID
- A required collage_id linking it to a collage
- A URL pointing to the storage location
- A creation timestamp

The foreign key with `ON DELETE CASCADE` ensures that when a collage is deleted, all its photos are automatically deleted.

### collage_settings

```sql
CREATE TABLE collage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collage_id uuid NOT NULL REFERENCES collages(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX collage_settings_collage_id_idx ON collage_settings(collage_id);
CREATE UNIQUE INDEX collage_settings_collage_id_key ON collage_settings(collage_id);
```

The `collage_settings` table stores the 3D scene configuration for each collage:
- Each record has a unique ID
- A required collage_id (with a unique constraint to ensure one settings record per collage)
- A JSONB field containing all scene settings
- Creation and update timestamps

The JSONB format allows for flexible storage of complex settings without requiring schema changes.

### stock_photos

```sql
CREATE TABLE stock_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

The `stock_photos` table stores references to curated stock photos:
- Each stock photo has a unique ID
- A URL pointing to the external image (e.g., Pexels)
- A category for filtering (e.g., 'people', 'landscape')
- A creation timestamp

## User Management Tables

### users

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

The `users` table extends Supabase's auth.users table:
- Uses the same ID as auth.users
- Stores the email for easy access
- Includes creation and update timestamps

### user_roles

```sql
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);
```

The `user_roles` table implements role-based access control:
- Each record has a unique ID
- A required user_id linking to auth.users
- A role field limited to 'admin' or 'user'
- Creation and update timestamps
- A unique constraint on user_id and role to prevent duplicates

## Application Settings Tables

### settings

```sql
CREATE TABLE settings (
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
```

The `settings` table stores global application settings:
- Each record has a unique ID
- Color scheme settings
- Logo and background image URLs
- Feature toggles
- Creation and update timestamps

### sound_settings

```sql
CREATE TABLE sound_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  volume float DEFAULT 1.0,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

The `sound_settings` table stores user-specific sound preferences:
- Each record has a unique ID
- A required user_id linking to auth.users
- Volume level and enabled flag
- Creation and update timestamps

### images

```sql
CREATE TABLE images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  alt_text text,
  section text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

The `images` table stores references to application images:
- Each image has a unique ID
- A name and URL
- Optional alt text for accessibility
- A section identifier for organization
- Creation and update timestamps

## JSON Schema for collage_settings.settings

The `settings` field in the `collage_settings` table uses a complex JSON structure:

```json
{
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
}
```

This schema includes:
- General scene settings (grid, floor, camera)
- Lighting configuration (spotlights, ambient light)
- Background settings
- Animation controls
- Pattern-specific settings for each animation type

## Storage Schema

### photos Bucket

```
photos/
  ├── {collage_id}/
  │   ├── {random_id}.jpg
  │   ├── {random_id}.png
  │   └── ...
  └── ...
```

The storage structure uses:
- A top-level `photos` bucket
- Subdirectories for each collage using the collage ID
- Random IDs for filenames to prevent collisions
- Original file extensions preserved

## Triggers and Functions

### create_default_collage_settings()

```sql
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
    '{...default settings JSON...}'::jsonb
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_collage_settings
  AFTER INSERT ON collages
  FOR EACH ROW
  EXECUTE FUNCTION create_default_collage_settings();
```

This trigger automatically creates default settings when a new collage is created.

### update_updated_at_column()

```sql
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

CREATE TRIGGER update_collage_settings_updated_at
  BEFORE UPDATE ON collage_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

This trigger automatically updates the `updated_at` timestamp when a record is updated.

### handle_auth_user_created() and handle_auth_user_updated()

```sql
CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.created_at, now()))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_auth_user_created();
```

These triggers synchronize Supabase Auth users with the public users table and assign default roles.