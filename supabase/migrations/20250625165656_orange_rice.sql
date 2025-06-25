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

-- Drop and recreate the publication to ensure it has the right settings
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.photos, 
  public.collages, 
  public.collage_settings
WITH (publish = 'insert, update, delete, truncate');

-- Drop existing function before recreating it with a different signature
DROP FUNCTION IF EXISTS check_realtime_status();

-- Create a function to check realtime status
CREATE OR REPLACE FUNCTION check_realtime_status()
RETURNS TABLE (
  table_name text,
  realtime_enabled boolean,
  publication_name text,
  events_published text
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
    p.pubname::text,
    CASE 
      WHEN p.pubinsert THEN 'INSERT' 
      ELSE '' 
    END || 
    CASE 
      WHEN p.pubupdate THEN (CASE WHEN p.pubinsert THEN ', UPDATE' ELSE 'UPDATE' END)
      ELSE '' 
    END || 
    CASE 
      WHEN p.pubdelete THEN (CASE WHEN p.pubinsert OR p.pubupdate THEN ', DELETE' ELSE 'DELETE' END)
      ELSE '' 
    END || 
    CASE 
      WHEN p.pubtruncate THEN (CASE WHEN p.pubinsert OR p.pubupdate OR p.pubdelete THEN ', TRUNCATE' ELSE 'TRUNCATE' END)
      ELSE '' 
    END AS events_published
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

-- Create a function to test realtime
CREATE OR REPLACE FUNCTION test_realtime(collage_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_photo_id uuid;
  result text;
BEGIN
  -- Insert a test photo
  INSERT INTO photos (collage_id, url)
  VALUES (collage_id, 'https://example.com/test-photo.jpg')
  RETURNING id INTO test_photo_id;
  
  -- Wait a moment
  PERFORM pg_sleep(1);
  
  -- Delete the test photo
  DELETE FROM photos WHERE id = test_photo_id;
  
  result := 'Test completed. A photo was created and deleted to test realtime. Check your client for events.';
  RETURN result;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION test_realtime(uuid) TO public;