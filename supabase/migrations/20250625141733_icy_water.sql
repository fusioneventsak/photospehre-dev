/*
  # Add Timestamp Triggers and User Sync Functions
  
  1. New Functions
    - update_updated_at_column: Updates timestamps on record changes
    - handle_auth_user_created: Syncs new auth users to public.users
    - handle_auth_user_updated: Syncs user email updates
  
  2. Triggers
    - Adds triggers to all tables with updated_at columns
    - Sets up auth user synchronization
    
  3. Admin Setup
    - Creates admin user if it doesn't exist
    - Assigns admin role
*/

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at 
  BEFORE UPDATE ON user_roles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at 
  BEFORE UPDATE ON settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sound_settings_updated_at ON sound_settings;
CREATE TRIGGER update_sound_settings_updated_at 
  BEFORE UPDATE ON sound_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_images_updated_at ON images;
CREATE TRIGGER update_images_updated_at 
  BEFORE UPDATE ON images 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- User synchronization function
CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.created_at, now()))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_auth_user_created();

-- Function to handle user updates
CREATE OR REPLACE FUNCTION handle_auth_user_updated()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET email = NEW.email
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION handle_auth_user_updated();

-- Ensure admin user exists
DO $$
DECLARE
  admin_email text := 'info@fusion-events.ca';
  admin_password text := 'fusion3873';
  admin_user_id uuid;
BEGIN
  -- Check if admin exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    -- Create new admin user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      now(),
      now()
    )
    RETURNING id INTO admin_user_id;
  END IF;

  -- Ensure admin role exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;