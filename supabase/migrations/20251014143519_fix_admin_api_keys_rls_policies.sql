/*
  # Fix Admin API Keys RLS Policies

  1. Changes
    - Drop existing incorrect RLS policies
    - Create new policies with correct email addresses and logic
    - Use auth.email() instead of checking sales_reps table
  
  2. Security
    - Only admins with correct @hito-digital.com emails can access
    - Uses auth.email() to directly check the authenticated user's email
  
  3. Fixed Issues
    - Corrected email addresses from @adequasys.com to @hito-digital.com
    - Fixed logic to check auth.users email instead of sales_reps
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read admin API keys" ON admin_api_keys;
DROP POLICY IF EXISTS "Admins can insert admin API keys" ON admin_api_keys;
DROP POLICY IF EXISTS "Admins can update admin API keys" ON admin_api_keys;
DROP POLICY IF EXISTS "Admins can delete admin API keys" ON admin_api_keys;

-- Create new policies with correct logic and emails
CREATE POLICY "Admins can read admin API keys"
  ON admin_api_keys
  FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'etienne.poulain@hito-digital.com',
      'benoit.civel@hito-digital.com',
      'vincent.ientile@hito-digital.com'
    )
  );

CREATE POLICY "Admins can insert admin API keys"
  ON admin_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'etienne.poulain@hito-digital.com',
      'benoit.civel@hito-digital.com',
      'vincent.ientile@hito-digital.com'
    )
  );

CREATE POLICY "Admins can update admin API keys"
  ON admin_api_keys
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'etienne.poulain@hito-digital.com',
      'benoit.civel@hito-digital.com',
      'vincent.ientile@hito-digital.com'
    )
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'etienne.poulain@hito-digital.com',
      'benoit.civel@hito-digital.com',
      'vincent.ientile@hito-digital.com'
    )
  );

CREATE POLICY "Admins can delete admin API keys"
  ON admin_api_keys
  FOR DELETE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'etienne.poulain@hito-digital.com',
      'benoit.civel@hito-digital.com',
      'vincent.ientile@hito-digital.com'
    )
  );
