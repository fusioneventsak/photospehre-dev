-- Enable Realtime for the photos table
-- This migration ensures that the photos table is properly configured for Realtime

-- First, check if the publication exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    -- Create the publication if it doesn't exist
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add the photos table to the publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'photos'
  ) THEN
    -- Add the photos table to the publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;
  END IF;
END $$;

-- Make sure the collages table is also in the publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'collages'
  ) THEN
    -- Add the collages table to the publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.collages;
  END IF;
END $$;

-- Make sure the collage_settings table is also in the publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'collage_settings'
  ) THEN
    -- Add the collage_settings table to the publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.collage_settings;
  END IF;
END $$;

-- Create a function to check if realtime is enabled
CREATE OR REPLACE FUNCTION check_realtime_status()
RETURNS TABLE (
  table_name text,
  realtime_enabled boolean,
  publication_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.tablename::text,
    true AS realtime_enabled,
    p.pubname::text
  FROM 
    pg_publication p
  JOIN 
    pg_publication_tables pt 
  ON 
    p.pubname = pt.pubname
  WHERE 
    pt.schemaname = 'public'
  ORDER BY 
    pt.tablename;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION check_realtime_status() TO public;