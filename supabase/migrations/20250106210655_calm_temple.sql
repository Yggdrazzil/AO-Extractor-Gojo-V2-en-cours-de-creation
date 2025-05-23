/*
  # Create RFPs and Sales Reps tables

  1. New Tables
    - `sales_reps`
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text, unique)
      - `created_at` (timestamp)
    - `rfps`
      - `id` (uuid, primary key)
      - `client` (text)
      - `mission` (text)
      - `location` (text)
      - `max_rate` (numeric, nullable)
      - `created_at` (timestamp)
      - `start_date` (timestamp)
      - `status` (text)
      - `assigned_to` (uuid, references sales_reps)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create sales_reps table
CREATE TABLE IF NOT EXISTS sales_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users"
  ON sales_reps
  FOR SELECT
  TO authenticated
  USING (true);

-- Create rfps table with enum for status
CREATE TYPE rfp_status AS ENUM ('À traiter', 'En cours', 'Traité', 'Refusé');

CREATE TABLE IF NOT EXISTS rfps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client text NOT NULL,
  mission text NOT NULL,
  location text NOT NULL,
  max_rate numeric,
  created_at timestamptz DEFAULT now(),
  start_date timestamptz NOT NULL,
  status rfp_status DEFAULT 'À traiter',
  assigned_to uuid REFERENCES sales_reps(id) NOT NULL,
  raw_content text NOT NULL
);

ALTER TABLE rfps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users"
  ON rfps
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);