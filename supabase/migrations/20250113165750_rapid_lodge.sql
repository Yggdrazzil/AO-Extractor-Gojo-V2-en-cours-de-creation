/*
  # Add is_read column to rfps table

  1. Changes
    - Add `is_read` boolean column to `rfps` table with default value false
    - Set existing rows to have is_read = false
*/

-- Add is_read column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfps' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE rfps ADD COLUMN is_read boolean DEFAULT false;
  END IF;
END $$;