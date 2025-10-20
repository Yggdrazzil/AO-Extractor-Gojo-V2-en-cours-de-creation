/*
  # Fix Admin API Keys RLS Policies v3

  1. Changes
    - Use auth.jwt() to extract email from JWT token instead of querying auth.users
    - This avoids "permission denied for table users" error
  
  2. Security
    - Only authenticated users with admin emails can access
    - All operations (SELECT, INSERT, UPDATE, DELETE) are protected
  
  3. Fixed Issues
    - Users don't have permission to query auth.users directly
    - Extract email from JWT token which is always accessible
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can read admin API keys" ON admin_api_keys;
DROP POLICY IF EXISTS "Admins can insert admin API keys" ON admin_api_keys;
DROP POLICY IF EXISTS "Admins can update admin API keys" ON admin_api_keys;
DROP POLICY IF EXISTS "Admins can delete admin API keys" ON admin_api_keys;

-- Create SELECT policy
CREATE POLICY "Admins can read admin API keys"
  ON admin_api_keys
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'email') IN (
      'etienne.poulain@hito-digital.com',
      'benoit.civel@hito-digital.com',
      'vincent.ientile@hito-digital.com'
    )
  );

-- Create INSERT policy (uses WITH CHECK, not USING)
CREATE POLICY "Admins can insert admin API keys"
  ON admin_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'email') IN (
      'etienne.poulain@hito-digital.com',
      'benoit.civel@hito-digital.com',
      'vincent.ientile@hito-digital.com'
    )
  );

-- Create UPDATE policy (uses both USING and WITH CHECK)
CREATE POLICY "Admins can update admin API keys"
  ON admin_api_keys
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'email') IN (
      'etienne.poulain@hito-digital.com',
      'benoit.civel@hito-digital.com',
      'vincent.ientile@hito-digital.com'
    )
  )
  WITH CHECK (
    (auth.jwt()->>'email') IN (
      'etienne.poulain@hito-digital.com',
      'benoit.civel@hito-digital.com',
      'vincent.ientile@hito-digital.com'
    )
  );

-- Create DELETE policy
CREATE POLICY "Admins can delete admin API keys"
  ON admin_api_keys
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'email') IN (
      'etienne.poulain@hito-digital.com',
      'benoit.civel@hito-digital.com',
      'vincent.ientile@hito-digital.com'
    )
  );
