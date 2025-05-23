/*
  # Add LinkedIn links table

  1. New Tables
    - `linkedin_links`
      - `id` (uuid, primary key)
      - `rfp_id` (uuid, references rfps)
      - `url` (text)
      - `name` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `linkedin_links` table
    - Add policies for authenticated users
*/

-- Create linkedin_links table
CREATE TABLE IF NOT EXISTS linkedin_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id uuid REFERENCES rfps(id) ON DELETE CASCADE,
  url text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE linkedin_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
ON linkedin_links FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert access for authenticated users"
ON linkedin_links FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update access for authenticated users"
ON linkedin_links FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete access for authenticated users"
ON linkedin_links FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Add index for better performance
CREATE INDEX idx_linkedin_links_rfp_id ON linkedin_links(rfp_id);

-- Add helpful description
COMMENT ON TABLE linkedin_links IS 'Stores LinkedIn profile links for prospects associated with RFPs';