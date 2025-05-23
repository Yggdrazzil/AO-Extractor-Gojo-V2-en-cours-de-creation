/*
  # Fix sales representatives table and data

  1. Changes
    - Drop and recreate sales_reps table with proper structure
    - Add proper RLS policies
    - Insert initial sales representatives data
    - Fix foreign key constraints

  2. Security
    - Enable RLS on sales_reps table
    - Add policy for authenticated users to read data
*/

-- First drop the foreign key constraint from rfps table
ALTER TABLE IF EXISTS rfps
  DROP CONSTRAINT IF EXISTS rfps_assigned_to_fkey;

-- Drop and recreate sales_reps table
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

-- Add RLS policy
CREATE POLICY "Allow read access to authenticated users"
  ON sales_reps
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial sales reps data
INSERT INTO sales_reps (name, code) VALUES
  ('IKH', 'IKH'),
  ('BVI', 'BVI'),
  ('GMA', 'GMA'),
  ('TSA', 'TSA'),
  ('EPO', 'EPO'),
  ('BCI', 'BCI'),
  ('VIE', 'VIE');

-- Recreate foreign key constraint on rfps table
ALTER TABLE rfps
  ADD CONSTRAINT rfps_assigned_to_fkey 
  FOREIGN KEY (assigned_to) 
  REFERENCES sales_reps(id)
  ON DELETE RESTRICT;