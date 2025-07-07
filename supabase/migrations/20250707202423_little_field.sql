/*
  # Create client_needs table

  1. New Tables
    - `client_needs`
      - `id` (uuid, primary key)
      - `text_content` (text, nullable)
      - `file_name` (text, nullable)
      - `file_url` (text, nullable)
      - `file_content` (text, nullable)
      - `selected_need_id` (text, not null)
      - `selected_need_title` (text, not null)
      - `availability` (text, default '-')
      - `daily_rate` (numeric, nullable)
      - `residence` (text, default '-')
      - `mobility` (text, default '-')
      - `phone` (text, default '-')
      - `email` (text, default '-')
      - `status` (text, default 'À traiter')
      - `assigned_to` (uuid, not null, references sales_reps)
      - `is_read` (boolean, default false)
      - `created_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `client_needs` table
    - Add policies for authenticated users to perform CRUD operations
*/

-- Create client_needs table
CREATE TABLE IF NOT EXISTS client_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text_content text,
  file_name text,
  file_url text,
  file_content text,
  selected_need_id text NOT NULL,
  selected_need_title text NOT NULL,
  availability text DEFAULT '-'::text,
  daily_rate numeric,
  residence text DEFAULT '-'::text,
  mobility text DEFAULT '-'::text,
  phone text DEFAULT '-'::text,
  email text DEFAULT '-'::text,
  status text DEFAULT 'À traiter'::text,
  assigned_to uuid NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE client_needs
  ADD CONSTRAINT client_needs_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES sales_reps(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_needs_assigned_to ON client_needs USING btree (assigned_to);
CREATE INDEX IF NOT EXISTS idx_client_needs_is_read ON client_needs USING btree (is_read);
CREATE INDEX IF NOT EXISTS idx_client_needs_selected_need_id ON client_needs USING btree (selected_need_id);
CREATE INDEX IF NOT EXISTS idx_client_needs_status ON client_needs USING btree (status);

-- Enable Row Level Security
ALTER TABLE client_needs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable delete for authenticated users"
  ON client_needs
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users"
  ON client_needs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable read access for authenticated users"
  ON client_needs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for authenticated users"
  ON client_needs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);