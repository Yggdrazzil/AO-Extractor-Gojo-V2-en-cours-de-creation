/*
  # Add authentication and fix RLS policies

  1. Changes
    - Drop existing RLS policies to start fresh
    - Add new comprehensive RLS policies for authenticated users
    - Add auth user check to policies
  
  2. Security
    - Enable RLS on tables
    - Add policies for CRUD operations
    - Ensure proper authentication checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON rfps;

-- Add new comprehensive policies
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