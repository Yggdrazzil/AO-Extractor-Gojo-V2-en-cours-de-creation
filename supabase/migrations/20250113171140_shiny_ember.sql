/*
  # Fix is_read column in rfps table

  1. Changes
    - Drop and recreate is_read column with proper constraints
    - Add index for better performance
    - Set up proper permissions

  2. Security
    - Grant proper permissions to authenticated users
*/

-- Drop existing column and constraints
ALTER TABLE rfps DROP COLUMN IF EXISTS is_read;

-- Add column with proper constraints
ALTER TABLE rfps 
  ADD COLUMN is_read boolean NOT NULL DEFAULT false;

-- Add index for better query performance
DROP INDEX IF EXISTS idx_rfps_is_read;
CREATE INDEX idx_rfps_is_read ON rfps(is_read);

-- Set all existing records to unread
UPDATE rfps SET is_read = false;

-- Add helpful description
COMMENT ON COLUMN rfps.is_read IS 'Indicates whether the RFP has been viewed (true) or is new/unread (false)';

-- Ensure proper permissions
GRANT SELECT, UPDATE(is_read) ON rfps TO authenticated;