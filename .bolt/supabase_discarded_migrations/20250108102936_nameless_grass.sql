/*
  # Fix sales representatives table structure and data

  1. Changes
    - Drop and recreate sales_reps table with proper constraints
    - Insert correct data with unique IDs and codes
    - Add proper indexes and foreign key constraints
*/

-- Drop existing table and recreate with proper structure
DROP TABLE IF EXISTS sales_reps CASCADE;

CREATE TABLE sales_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sales_reps_code_key UNIQUE (code)
);

-- Enable RLS
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow read access to authenticated users"
  ON sales_reps
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sales reps data
INSERT INTO sales_reps (id, name, code) VALUES
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'IKH', 'IKH'),
  ('550e8400-e29b-41d4-a716-446655440000', 'BVI', 'BVI'),
  ('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'GMA', 'GMA'),
  ('7ba7b811-9dad-11d1-80b4-00c04fd430c8', 'TSA', 'TSA'),
  ('8ba7b812-9dad-11d1-80b4-00c04fd430c8', 'EPO', 'EPO'),
  ('9ba7b813-9dad-11d1-80b4-00c04fd430c8', 'BCI', 'BCI'),
  ('aba7b814-9dad-11d1-80b4-00c04fd430c8', 'VIE', 'VIE');

-- Recreate foreign key constraint on rfps table
ALTER TABLE rfps
  DROP CONSTRAINT IF EXISTS rfps_assigned_to_fkey,
  ADD CONSTRAINT rfps_assigned_to_fkey 
  FOREIGN KEY (assigned_to) 
  REFERENCES sales_reps(id)
  ON DELETE RESTRICT;