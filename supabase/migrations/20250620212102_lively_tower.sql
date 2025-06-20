/*
  # Create prospects table for profile management

  1. New Tables
    - `prospects`
      - `id` (uuid, primary key)
      - `text_content` (text, optional textual information)
      - `file_name` (text, optional uploaded file name)
      - `file_url` (text, optional uploaded file URL)
      - `date_update` (timestamptz, date of last update)
      - `availability` (text, candidate availability)
      - `daily_rate` (numeric, daily rate)
      - `residence` (text, candidate residence)
      - `mobility` (text, candidate mobility)
      - `phone` (text, candidate phone)
      - `email` (text, candidate email)
      - `status` (prospect_status, processing status)
      - `assigned_to` (uuid, references sales_reps)
      - `is_read` (boolean, read status)
      - `created_at` (timestamptz, creation date)

  2. Security
    - Enable RLS on `prospects` table
    - Add policies for authenticated users to manage prospects
*/

-- Create enum for prospect status
CREATE TYPE IF NOT EXISTS prospect_status AS ENUM ('À traiter', 'Traité');

-- Create prospects table
CREATE TABLE IF NOT EXISTS public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text_content text,
  file_name text,
  file_url text,
  date_update timestamptz DEFAULT now(),
  availability text DEFAULT '',
  daily_rate numeric,
  residence text DEFAULT '',
  mobility text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  status prospect_status DEFAULT 'À traiter',
  assigned_to uuid NOT NULL REFERENCES public.sales_reps(id),
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON public.prospects
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users"
  ON public.prospects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users"
  ON public.prospects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users"
  ON public.prospects
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_prospects_is_read ON public.prospects(is_read);
CREATE INDEX IF NOT EXISTS idx_prospects_assigned_to ON public.prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON public.prospects(status);