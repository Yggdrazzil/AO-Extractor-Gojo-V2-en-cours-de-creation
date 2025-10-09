/*
  # Create Admin API Keys Table
  
  1. New Tables
    - `admin_api_keys`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `api_key` (text, encrypted API key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `admin_api_keys` table
    - Add policy for admins to read/write their shared API keys
    
  3. Important Notes
    - This table stores OpenAI API keys for admin users
    - API keys are shared between admin users (Benoit CIVEL, Vincent IENTILE, and the user who sets the key)
*/

CREATE TABLE IF NOT EXISTS admin_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read any admin API key
CREATE POLICY "Admins can read admin API keys"
  ON admin_api_keys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_reps
      WHERE sales_reps.id = auth.uid()
      AND sales_reps.email IN (
        'eponomarev@adequasys.com',
        'bcivel@adequasys.com',
        'vientile@adequasys.com'
      )
    )
  );

-- Policy: Admins can insert admin API keys
CREATE POLICY "Admins can insert admin API keys"
  ON admin_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales_reps
      WHERE sales_reps.id = auth.uid()
      AND sales_reps.email IN (
        'eponomarev@adequasys.com',
        'bcivel@adequasys.com',
        'vientile@adequasys.com'
      )
    )
  );

-- Policy: Admins can update admin API keys
CREATE POLICY "Admins can update admin API keys"
  ON admin_api_keys
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_reps
      WHERE sales_reps.id = auth.uid()
      AND sales_reps.email IN (
        'eponomarev@adequasys.com',
        'bcivel@adequasys.com',
        'vientile@adequasys.com'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales_reps
      WHERE sales_reps.id = auth.uid()
      AND sales_reps.email IN (
        'eponomarev@adequasys.com',
        'bcivel@adequasys.com',
        'vientile@adequasys.com'
      )
    )
  );

-- Policy: Admins can delete admin API keys
CREATE POLICY "Admins can delete admin API keys"
  ON admin_api_keys
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_reps
      WHERE sales_reps.id = auth.uid()
      AND sales_reps.email IN (
        'eponomarev@adequasys.com',
        'bcivel@adequasys.com',
        'vientile@adequasys.com'
      )
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_api_keys_user_id ON admin_api_keys(user_id);