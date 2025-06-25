/*
  # Update collage codes to 4-digit format
  
  1. Changes
    - Modify code_format constraint to require 4-digit codes
    - Update existing codes to 4-digit format
    - Add function to generate random 4-digit codes
  
  2. Benefits
    - Shorter, more memorable codes for users
    - Easier to type and share verbally
    - Still provides sufficient uniqueness (10,000 possible combinations)
*/

-- First, drop the existing constraint if it exists
ALTER TABLE collages DROP CONSTRAINT IF EXISTS code_format;

-- Update existing codes to 4-digit format
-- This takes the first 4 characters of existing codes
UPDATE collages
SET code = UPPER(SUBSTRING(code, 1, 4));

-- Add constraint to ensure codes are exactly 4 characters (letters and numbers)
ALTER TABLE collages ADD CONSTRAINT code_format 
  CHECK (code ~ '^[A-Z0-9]{4}$');

-- Create a function to generate random 4-digit codes
CREATE OR REPLACE FUNCTION generate_random_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text[] := ARRAY['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  result text := '';
  i integer := 0;
BEGIN
  -- Generate a 4-character random code
  FOR i IN 1..4 LOOP
    result := result || chars[1 + floor(random() * 36)];
  END LOOP;
  RETURN result;
END;
$$;