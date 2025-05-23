/*
  # Create LinkedIn Links Table

  1. New Tables
    - `linkedin_links`
      - `id` (uuid, primary key)
      - `rfp_id` (uuid, foreign key to rfps)
      - `url` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Add foreign key constraint
*/

-- Create linkedin_links table
CREATE TABLE IF NOT EXISTS linkedin_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id uuid REFERENCES rfps(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE linkedin_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
ON linkedin_links FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON linkedin_links FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON linkedin_links FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
ON linkedin_links FOR DELETE
TO authenticated
USING (true);

-- Add index for better performance
CREATE INDEX idx_linkedin_links_rfp_id ON linkedin_links(rfp_id);

-- Add helpful description
COMMENT ON TABLE linkedin_links IS 'Stores profile links for prospects';