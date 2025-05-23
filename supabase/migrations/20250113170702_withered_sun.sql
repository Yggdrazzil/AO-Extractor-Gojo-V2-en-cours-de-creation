/*
  # Fix is_read column implementation

  1. Changes
    - Drop any existing is_read column to ensure clean state
    - Add is_read column with proper constraints and default value
    - Set default value for existing records
    - Add column description

  2. Security
    - No changes to RLS policies needed as existing policies cover the new column
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