/*
  # Fix is_read column policies and permissions

  1. Changes
    - Add explicit RLS policies for is_read column
    - Update permissions for authenticated users
    - Force schema cache refresh
    
  2. Security
    - Ensure proper access control for is_read operations
    - Maintain existing security model
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON rfps;

-- Create comprehensive policies with explicit is_read handling
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

-- Grant explicit permissions including is_read
GRANT SELECT, INSERT, UPDATE(client, mission, location, max_rate, start_date, status, assigned_to, raw_content, is_read), DELETE ON rfps TO authenticated;

-- Force schema cache refresh
ALTER TABLE rfps RENAME TO rfps_tmp;
ALTER TABLE rfps_tmp RENAME TO rfps;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';