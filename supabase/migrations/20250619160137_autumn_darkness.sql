/*
  # Fix is_read column issue

  1. Ensure is_read column exists
    - Add is_read column if it doesn't exist
    - Set default value to false
    - Update existing records to have is_read = false

  2. Refresh schema cache
    - Force schema refresh to ensure changes are recognized
*/

-- First, check if the column exists and add it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rfps' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE rfps ADD COLUMN is_read boolean DEFAULT false;
  END IF;
END $$;

-- Ensure all existing records have is_read set to false if null
UPDATE rfps SET is_read = false WHERE is_read IS NULL;

-- Make sure the column has a proper default
ALTER TABLE rfps ALTER COLUMN is_read SET DEFAULT false;

-- Force a schema cache refresh by updating table comment
COMMENT ON TABLE rfps IS 'RFP table with is_read column - updated';

-- Verify the column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rfps' AND column_name = 'is_read'
  ) THEN
    RAISE EXCEPTION 'is_read column was not created successfully';
  END IF;
END $$;