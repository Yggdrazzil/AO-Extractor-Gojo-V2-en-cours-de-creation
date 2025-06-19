/*
  # Add is_read column to rfps table

  1. Changes
    - Add `is_read` column to `rfps` table with default value `false`
    - Update existing records to set `is_read` to `false`

  2. Security
    - No changes to RLS policies needed
*/

-- Add the is_read column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rfps' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE rfps ADD COLUMN is_read boolean DEFAULT false;
    
    -- Update existing records to set is_read to false
    UPDATE rfps SET is_read = false WHERE is_read IS NULL;
  END IF;
END $$;