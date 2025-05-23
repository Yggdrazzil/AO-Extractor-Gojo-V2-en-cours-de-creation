/*
  # Add is_read column to rfps table

  1. Changes
    - Add is_read column to rfps table with NOT NULL constraint and default value
    - Set all existing records to false
    - Add column description

  2. Notes
    - This ensures all RFPs have a read status
    - Default false means new RFPs are unread by default
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

-- Add the column fresh with NOT NULL constraint and default value
ALTER TABLE rfps ADD COLUMN is_read boolean NOT NULL DEFAULT false;

-- Update all existing records
UPDATE rfps SET is_read = false;

-- Add column description
COMMENT ON COLUMN rfps.is_read IS 'Indicates whether the RFP has been viewed (true) or is new/unread (false)';