/*
  # Add is_read column to rfps table

  1. New Columns
    - `is_read` (boolean, default false) - Track if RFP has been read by user

  2. Changes
    - Add is_read column to rfps table with default value false
    - Update existing records to set is_read = false

  3. Security
    - No changes to RLS policies needed as this column follows existing permissions
*/

-- Add is_read column to rfps table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rfps' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE rfps ADD COLUMN is_read boolean DEFAULT false;
    
    -- Update existing records to set is_read = false
    UPDATE rfps SET is_read = false WHERE is_read IS NULL;
    
    -- Make the column NOT NULL after setting default values
    ALTER TABLE rfps ALTER COLUMN is_read SET NOT NULL;
  END IF;
END $$;