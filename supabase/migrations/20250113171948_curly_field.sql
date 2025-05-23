/*
  # Fix New badge persistence

  1. Changes
    - Drop and recreate is_read column with proper constraints
    - Update RLS policies for is_read
    - Add explicit update permission for is_read column
    
  2. Security
    - Maintain RLS policies
    - Grant specific column permissions
*/

-- Drop existing column and related objects
DROP INDEX IF EXISTS idx_rfps_is_read;
ALTER TABLE rfps DROP COLUMN IF EXISTS is_read;

-- Add the column with proper constraints
ALTER TABLE rfps ADD COLUMN is_read boolean NOT NULL DEFAULT false;

-- Create optimized index
CREATE INDEX idx_rfps_is_read ON rfps(is_read);

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON rfps;

-- Create comprehensive policies
CREATE POLICY "Enable read access for authenticated users"
ON rfps FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert access for authenticated users"
ON rfps FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update access for authenticated users"
ON rfps FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete access for authenticated users"
ON rfps FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Grant explicit permissions for is_read column
GRANT UPDATE(is_read) ON rfps TO authenticated;

-- Force schema cache refresh
ALTER TABLE rfps RENAME TO rfps_tmp;
ALTER TABLE rfps_tmp RENAME TO rfps;

-- Add helpful description
COMMENT ON COLUMN rfps.is_read IS 'Indicates whether the RFP has been viewed (true) or is new/unread (false)';

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';