/*
  # Clean Database Setup

  1. Tables
    - `sales_reps`: Store sales representatives information
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text, unique)
      - `created_at` (timestamptz)
    
    - `rfps`: Store RFP (Request for Proposal) information
      - `id` (uuid, primary key)
      - `client` (text)
      - `mission` (text)
      - `location` (text)
      - `max_rate` (numeric)
      - `created_at` (timestamptz)
      - `start_date` (timestamptz)
      - `status` (rfp_status enum)
      - `assigned_to` (uuid, foreign key to sales_reps)
      - `raw_content` (text)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    - Set up proper authentication

  3. Initial Data
    - Insert initial sales representatives
*/

-- Clean up existing objects
DROP TABLE IF EXISTS rfps CASCADE;
DROP TABLE IF EXISTS sales_reps CASCADE;
DROP TYPE IF EXISTS rfp_status CASCADE;

-- Create sales_reps table
CREATE TABLE sales_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sales_reps_code_key UNIQUE (code)
);

-- Create RFP status enum and rfps table
CREATE TYPE rfp_status AS ENUM ('À traiter', 'En cours', 'Traité', 'Refusé');

CREATE TABLE rfps (
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

-- Enable RLS
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfps ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow read access to authenticated users"
  ON sales_reps
  FOR SELECT
  TO authenticated
  USING (true);

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

-- Insert initial sales representatives
INSERT INTO sales_reps (name, code) VALUES
  ('Ikram Hamdi', 'IKH'),
  ('Benjamin Vidal', 'BVI'),
  ('Guillaume Martin', 'GMA'),
  ('Thomas Santos', 'TSA'),
  ('Etienne Poulain', 'EPO'),
  ('Benjamin Cirot', 'BCI'),
  ('Vincent Emeriau', 'VIE');

-- Create admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'etienne.poulain@hito.digital'
  ) THEN
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      'etienne.poulain@hito.digital',
      crypt('demo123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"role":"admin"}',
      '{"is_admin":true}'
    );
  END IF;
END $$;