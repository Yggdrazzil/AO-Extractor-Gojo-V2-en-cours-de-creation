/*
  # Fix is_read column implementation

  1. Changes
    - Drop and recreate is_read column with proper constraints
    - Add NOT NULL constraint with default value
    - Update all existing records
    - Add column description
    - Add index for performance

  2. Notes
    - This ensures all RFPs have a read status
    - Default false means new RFPs are unread by default
    - Index improves query performance when filtering by read status
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

-- Add index for better performance
CREATE INDEX idx_rfps_is_read ON rfps(is_read);

-- Grant permissions
GRANT SELECT, UPDATE (is_read) ON rfps TO authenticated;