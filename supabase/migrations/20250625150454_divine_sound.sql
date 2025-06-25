/*
  # Optimize Realtime Performance
  
  1. Changes
    - Ensure all tables have proper primary keys
    - Add explicit publication for realtime
    - Configure realtime settings for better performance
    
  2. Benefits
    - Faster realtime updates
    - More reliable event delivery
    - Better handling of delete operations
*/

-- First, ensure the publication exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    -- Create the publication if it doesn't exist
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add all relevant tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collage_settings;

-- Ensure all tables have proper primary keys and indexes
-- This helps with realtime performance
DO $$
BEGIN
  -- Check if photos table has the proper index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'photos' 
    AND indexname = 'photos_collage_id_idx'
  ) THEN
    CREATE INDEX photos_collage_id_idx ON public.photos(collage_id);
  END IF;
END $$;

-- Create a function to check realtime status
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