/*
  # Fix schema synchronization issues

  1. Changes
    - Clean up schema by properly dropping and recreating is_read column
    - Force schema cache refresh
    - Ensure proper type definitions

  2. Security
    - Maintain existing permissions
*/

-- First, ensure the column exists and has the correct type
DO $$ 
BEGIN 
  -- Drop the column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfps' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE rfps DROP COLUMN is_read;
  END IF;
END $$;

-- Recreate the column with proper constraints
ALTER TABLE rfps ADD COLUMN is_read boolean NOT NULL DEFAULT false;

-- Force schema refresh by altering and then restoring the column comment
COMMENT ON COLUMN rfps.is_read IS 'Temporary comment to force schema refresh';
COMMENT ON COLUMN rfps.is_read IS 'Indicates whether the RFP has been viewed (true) or is new/unread (false)';

-- Recreate the index
DROP INDEX IF EXISTS idx_rfps_is_read;
CREATE INDEX idx_rfps_is_read ON rfps(is_read);

-- Ensure proper permissions
GRANT SELECT, UPDATE(is_read) ON rfps TO authenticated;

-- Notify system of schema changes
NOTIFY pgrst, 'reload schema';