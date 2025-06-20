/*
  # Create LinkedIn Links Table

  1. New Tables
    - `linkedin_links`
      - `id` (uuid, primary key)
      - `rfp_id` (uuid, foreign key to rfps table)
      - `url` (text, LinkedIn profile URL)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `linkedin_links` table
    - Add policy for authenticated users to manage their LinkedIn links

  3. Indexes
    - Add index on rfp_id for faster queries
*/

-- Create the linkedin_links table
CREATE TABLE IF NOT EXISTS public.linkedin_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id uuid NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.linkedin_links ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_linkedin_links_rfp_id ON public.linkedin_links(rfp_id);

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