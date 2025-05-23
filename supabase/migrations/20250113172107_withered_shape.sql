/*
  # Fix is_read column issues

  1. Changes
    - Drop and recreate is_read column with proper constraints
    - Add index for better performance
    - Set proper RLS policies
    - Grant explicit permissions
    - Force schema cache refresh
*/

-- Disable RLS temporarily for maintenance
ALTER TABLE rfps DISABLE ROW LEVEL SECURITY;

-- Drop existing column and related objects
DROP INDEX IF EXISTS idx_rfps_is_read;
ALTER TABLE rfps DROP COLUMN IF EXISTS is_read CASCADE;

-- Add the column with proper constraints
ALTER TABLE rfps ADD COLUMN is_read boolean NOT NULL DEFAULT false;

-- Create optimized index
CREATE INDEX idx_rfps_is_read ON rfps(is_read);

-- Re-enable RLS
ALTER TABLE rfps ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON rfps;

-- Create comprehensive policies
CREATE POLICY "Enable read access for authenticated users"
ON rfps FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON rfps FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON rfps FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON rfps FOR DELETE
TO authenticated
USING (true);

-- Grant explicit permissions
GRANT ALL ON rfps TO authenticated;

-- Force schema cache refresh
DO $$ 
BEGIN 
  -- Rename and back to force cache invalidation
  ALTER TABLE rfps RENAME TO rfps_tmp;
  ALTER TABLE rfps_tmp RENAME TO rfps;
  
  -- Force PostgREST to reload schema
  NOTIFY pgrst, 'reload schema';
END $$;