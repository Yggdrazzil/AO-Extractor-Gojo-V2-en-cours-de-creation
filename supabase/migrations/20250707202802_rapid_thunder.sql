/*
  # Client Needs Table Schema

  1. New Tables
    - `client_needs` - Stores profiles for client needs
      - `id` (uuid, primary key)
      - `text_content` (text)
      - `file_name` (text)
      - `file_url` (text)
      - `file_content` (text)
      - `selected_need_id` (text, not null)
      - `selected_need_title` (text, not null)
      - `availability` (text, default: '-')
      - `daily_rate` (numeric)
      - `residence` (text, default: '-')
      - `mobility` (text, default: '-')
      - `phone` (text, default: '-')
      - `email` (text, default: '-')
      - `status` (text, default: 'À traiter')
      - `assigned_to` (uuid, not null)
      - `is_read` (boolean, default: false)
      - `created_at` (timestamptz, default: now())
  
  2. Security
    - Enable RLS on `client_needs` table
    - Add policies for authenticated users
*/

-- Create client_needs table if it doesn't exist
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

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'client_needs_assigned_to_fkey' 
    AND conrelid = 'client_needs'::regclass
  ) THEN
    ALTER TABLE client_needs
      ADD CONSTRAINT client_needs_assigned_to_fkey
      FOREIGN KEY (assigned_to) REFERENCES sales_reps(id);
  END IF;
END
$$;

-- Create indexes for better performance if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_client_needs_assigned_to') THEN
    CREATE INDEX idx_client_needs_assigned_to ON client_needs USING btree (assigned_to);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_client_needs_is_read') THEN
    CREATE INDEX idx_client_needs_is_read ON client_needs USING btree (is_read);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_client_needs_selected_need_id') THEN
    CREATE INDEX idx_client_needs_selected_need_id ON client_needs USING btree (selected_need_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_client_needs_status') THEN
    CREATE INDEX idx_client_needs_status ON client_needs USING btree (status);
  END IF;
END
$$;

-- Enable Row Level Security if not already enabled
ALTER TABLE client_needs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_needs' 
    AND policyname = 'Enable delete for authenticated users'
  ) THEN
    CREATE POLICY "Enable delete for authenticated users"
      ON client_needs
      FOR DELETE
      TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_needs' 
    AND policyname = 'Enable insert for authenticated users'
  ) THEN
    CREATE POLICY "Enable insert for authenticated users"
      ON client_needs
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_needs' 
    AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users"
      ON client_needs
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'client_needs' 
    AND policyname = 'Enable update for authenticated users'
  ) THEN
    CREATE POLICY "Enable update for authenticated users"
      ON client_needs
      FOR UPDATE
      TO authenticated
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END
$$;