/*
  # Create LinkedIn Links Table

  1. New Tables
    - `linkedin_links`
      - `id` (uuid, primary key)
      - `rfp_id` (uuid, foreign key to rfps)
      - `url` (text, LinkedIn profile URL)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `linkedin_links` table
    - Add policies for authenticated users to manage their LinkedIn links

  3. Performance
    - Add index on rfp_id for faster queries
*/

-- Drop table if exists to start fresh
DROP TABLE IF EXISTS public.linkedin_links CASCADE;

-- Create the linkedin_links table
CREATE TABLE public.linkedin_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id uuid NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE public.linkedin_links 
ADD CONSTRAINT linkedin_links_rfp_id_fkey 
FOREIGN KEY (rfp_id) REFERENCES public.rfps(id) ON DELETE CASCADE;

-- Add URL validation constraint
ALTER TABLE public.linkedin_links 
ADD CONSTRAINT linkedin_links_url_check 
CHECK (url ~ '^https?://');

-- Create index for performance
CREATE INDEX linkedin_links_rfp_id_idx ON public.linkedin_links(rfp_id);

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