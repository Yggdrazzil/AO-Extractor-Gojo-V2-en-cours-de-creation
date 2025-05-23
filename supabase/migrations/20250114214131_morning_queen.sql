/*
  # Fix LinkedIn links table structure

  1. Changes
    - Remove name column as it's not needed anymore
    - Add NOT NULL constraint to rfp_id
    - Add validation for URL format
  
  2. Security
    - Maintain existing RLS policies
    - Add URL format check constraint
*/

-- First drop the name column as we don't need it
ALTER TABLE linkedin_links DROP COLUMN IF EXISTS name;

-- Add NOT NULL constraint to rfp_id if not already present
ALTER TABLE linkedin_links ALTER COLUMN rfp_id SET NOT NULL;

-- Add check constraint for LinkedIn URLs
ALTER TABLE linkedin_links
  ADD CONSTRAINT linkedin_links_url_format CHECK (
    url ~* '^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$'
  );

-- Update comment to reflect changes
COMMENT ON TABLE linkedin_links IS 'Stores LinkedIn profile links for prospects, with URL format validation';