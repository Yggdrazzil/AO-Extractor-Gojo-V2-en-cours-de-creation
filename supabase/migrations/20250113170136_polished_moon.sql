/*
  # Add is_read column to rfps table

  1. Changes
    - Add `is_read` boolean column to `rfps` table with default value of false
    - Set existing records to false by default
    - Add description of the column's purpose

  2. Purpose
    - Track whether an RFP has been viewed by users
    - Enable "New" badge functionality for unread RFPs
*/

-- Add is_read column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfps' AND column_name = 'is_read'
  ) THEN
    -- Add the column with a default value
    ALTER TABLE rfps ADD COLUMN is_read boolean DEFAULT false;
    
    -- Update existing records to have is_read = false
    UPDATE rfps SET is_read = false WHERE is_read IS NULL;
    
    -- Add a comment to explain the column's purpose
    COMMENT ON COLUMN rfps.is_read IS 'Indicates whether the RFP has been viewed (true) or is new/unread (false)';
  END IF;
END $$;