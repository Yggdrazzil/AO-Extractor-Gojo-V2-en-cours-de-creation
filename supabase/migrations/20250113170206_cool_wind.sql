/*
  # Fix is_read column in rfps table

  1. Changes
    - Add `is_read` boolean column to `rfps` table if it doesn't exist
    - Set default value to false
    - Update all existing records to have is_read = false
    - Add column description

  2. Purpose
    - Track whether an RFP has been viewed by users
    - Enable "New" badge functionality for unread RFPs
    - Fix previous migration attempts
*/

-- Drop the column if it exists (to clean up any previous attempts)
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfps' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE rfps DROP COLUMN is_read;
  END IF;
END $$;

-- Add the column fresh
ALTER TABLE rfps ADD COLUMN is_read boolean NOT NULL DEFAULT false;

-- Update all existing records
UPDATE rfps SET is_read = false;

-- Add column description
COMMENT ON COLUMN rfps.is_read IS 'Indicates whether the RFP has been viewed (true) or is new/unread (false)';