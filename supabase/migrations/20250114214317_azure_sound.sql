/*
  # Remove LinkedIn URL format validation

  1. Changes
    - Remove URL format constraint to allow any valid URL
  
  2. Security
    - Maintain existing RLS policies
*/

-- Remove the URL format constraint
ALTER TABLE linkedin_links DROP CONSTRAINT IF EXISTS linkedin_links_url_format;

-- Update table comment
COMMENT ON TABLE linkedin_links IS 'Stores profile links for prospects';