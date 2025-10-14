/*
  # Add comments field to reference_marketplace

  1. Changes
    - Add `comments` column to `reference_marketplace` table
    - Drop old `reference_marketplace_comments` table
  
  2. Notes
    - Switching from multi-comment system to single comment field
    - Matches the pattern used in other tabs (RFP, prospects, etc.)
*/

-- Add comments column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reference_marketplace' AND column_name = 'comments'
  ) THEN
    ALTER TABLE reference_marketplace ADD COLUMN comments text;
  END IF;
END $$;

-- Drop the old comments table if it exists
DROP TABLE IF EXISTS reference_marketplace_comments CASCADE;
