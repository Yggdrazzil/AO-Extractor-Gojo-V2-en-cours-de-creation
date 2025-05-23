-- Drop all existing objects related to is_read
DROP INDEX IF EXISTS idx_rfps_is_read;
ALTER TABLE rfps DROP COLUMN IF EXISTS is_read;

-- Recreate the column with proper constraints
ALTER TABLE rfps ADD COLUMN is_read boolean NOT NULL DEFAULT false;

-- Create index for performance
CREATE INDEX idx_rfps_is_read ON rfps(is_read);

-- Set permissions
GRANT SELECT, UPDATE(is_read) ON rfps TO authenticated;

-- Force schema cache refresh
ALTER TABLE rfps RENAME TO rfps_tmp;
ALTER TABLE rfps_tmp RENAME TO rfps;

-- Add helpful description
COMMENT ON COLUMN rfps.is_read IS 'Indicates whether the RFP has been viewed (true) or is new/unread (false)';

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';