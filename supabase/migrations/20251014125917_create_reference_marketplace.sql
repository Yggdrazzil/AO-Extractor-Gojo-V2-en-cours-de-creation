/*
  # Create Reference Marketplace Table

  1. New Tables
    - `reference_marketplace`
      - `id` (uuid, primary key)
      - `client` (text) - Nom du client
      - `operational_contact` (text) - Opérationnel à contacter
      - `phone` (text) - Téléphone
      - `email` (text) - Email
      - `tech_name` (text) - Nom du Tech
      - `sales_rep_id` (uuid, foreign key) - Commercial assigné
      - `pdf_url` (text, nullable) - URL du PDF uploadé
      - `pdf_name` (text, nullable) - Nom du fichier PDF
      - `created_by` (uuid, foreign key) - Utilisateur créateur
      - `created_at` (timestamptz)
    
    - `reference_marketplace_comments`
      - `id` (uuid, primary key)
      - `reference_id` (uuid, foreign key)
      - `user_email` (text)
      - `comment` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their references
    - Add policies for comments
*/

-- Create reference_marketplace table
CREATE TABLE IF NOT EXISTS reference_marketplace (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client text NOT NULL,
  operational_contact text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  tech_name text NOT NULL,
  sales_rep_id uuid REFERENCES sales_reps(id) ON DELETE SET NULL,
  pdf_url text,
  pdf_name text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create reference_marketplace_comments table
CREATE TABLE IF NOT EXISTS reference_marketplace_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid REFERENCES reference_marketplace(id) ON DELETE CASCADE NOT NULL,
  user_email text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reference_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_marketplace_comments ENABLE ROW LEVEL SECURITY;

-- Policies for reference_marketplace
CREATE POLICY "Authenticated users can view all references"
  ON reference_marketplace FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert references"
  ON reference_marketplace FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own references"
  ON reference_marketplace FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own references"
  ON reference_marketplace FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for reference_marketplace_comments
CREATE POLICY "Authenticated users can view all comments"
  ON reference_marketplace_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON reference_marketplace_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
  ON reference_marketplace_comments FOR UPDATE
  TO authenticated
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own comments"
  ON reference_marketplace_comments FOR DELETE
  TO authenticated
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reference_marketplace_sales_rep ON reference_marketplace(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_reference_marketplace_created_by ON reference_marketplace(created_by);
CREATE INDEX IF NOT EXISTS idx_reference_marketplace_created_at ON reference_marketplace(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reference_comments_reference_id ON reference_marketplace_comments(reference_id);
