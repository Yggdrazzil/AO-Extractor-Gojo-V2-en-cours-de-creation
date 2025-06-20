/*
  # Fix LinkedIn Links Table

  1. New Tables
    - `linkedin_links`
      - `id` (uuid, primary key)
      - `rfp_id` (uuid, foreign key to rfps)
      - `url` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `linkedin_links` table
    - Add policy for authenticated users to manage all linkedin_links

  3. Functions
    - Add helper function to create table if needed
*/

-- Drop existing table if it exists (to start fresh)
DROP TABLE IF EXISTS public.linkedin_links CASCADE;

-- Create the linkedin_links table
CREATE TABLE public.linkedin_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfp_id UUID NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.linkedin_links ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to view linkedin_links"
  ON public.linkedin_links
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert linkedin_links"
  ON public.linkedin_links
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update linkedin_links"
  ON public.linkedin_links
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete linkedin_links"
  ON public.linkedin_links
  FOR DELETE
  TO authenticated
  USING (true);

-- Create helper function for table creation (fallback)
CREATE OR REPLACE FUNCTION create_linkedin_links_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'linkedin_links'
  ) THEN
    -- Create table
    CREATE TABLE public.linkedin_links (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      rfp_id UUID NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE public.linkedin_links ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Allow authenticated users to manage linkedin_links"
      ON public.linkedin_links
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

-- Create helper function for executing SQL (fallback)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;