/*
  # Create linkedin_links table

  1. New Tables
    - `linkedin_links`
      - `id` (uuid, primary key)
      - `rfp_id` (uuid, foreign key to rfps table)
      - `url` (text, LinkedIn profile URL)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `linkedin_links` table
    - Add policies for authenticated users to manage LinkedIn links
*/

-- Create the linkedin_links table
CREATE TABLE IF NOT EXISTS public.linkedin_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id uuid NOT NULL REFERENCES public.rfps(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.linkedin_links ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users"
  ON public.linkedin_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users"
  ON public.linkedin_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users"
  ON public.linkedin_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_linkedin_links_rfp_id ON public.linkedin_links(rfp_id);