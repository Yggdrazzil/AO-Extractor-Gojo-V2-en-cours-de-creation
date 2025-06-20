/*
  # Fix LinkedIn Links functionality

  1. Tables
    - Ensure `linkedin_links` table exists with proper structure
    - Add proper RLS policies
    - Add foreign key constraint to rfps table

  2. Security
    - Enable RLS on `linkedin_links` table
    - Add policies for authenticated users to manage their links
*/

-- Create linkedin_links table if it doesn't exist
CREATE TABLE IF NOT EXISTS linkedin_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id uuid NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'linkedin_links_rfp_id_fkey'
  ) THEN
    ALTER TABLE linkedin_links 
    ADD CONSTRAINT linkedin_links_rfp_id_fkey 
    FOREIGN KEY (rfp_id) REFERENCES rfps(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE linkedin_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON linkedin_links;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON linkedin_links;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON linkedin_links;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON linkedin_links;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users"
  ON linkedin_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert access for authenticated users"
  ON linkedin_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update access for authenticated users"
  ON linkedin_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete access for authenticated users"
  ON linkedin_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);