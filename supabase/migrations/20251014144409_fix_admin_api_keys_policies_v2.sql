/*
  # Fix Admin API Keys RLS Policies v2

  1. Changes
    - Drop and recreate all RLS policies with correct syntax
    - Use subquery to get user email instead of non-existent auth.email()
    - Ensure INSERT policy has proper WITH CHECK clause
  
  2. Security
    - Only authenticated users with admin emails can access
    - All operations (SELECT, INSERT, UPDATE, DELETE) are protected
  
  3. Fixed Issues
    - auth.email() function doesn't exist, use subquery instead
    - INSERT policy needs WITH CHECK, not USING
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
    (SELECT auth.users.email FROM auth.users WHERE auth.users.id = auth.uid()) IN (
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
    (SELECT auth.users.email FROM auth.users WHERE auth.users.id = auth.uid()) IN (
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
    (SELECT auth.users.email FROM auth.users WHERE auth.users.id = auth.uid()) IN (
      'etienne.poulain@hito-digital.com',
      'benoit.civel@hito-digital.com',
      'vincent.ientile@hito-digital.com'
    )
  )
  WITH CHECK (
    (SELECT auth.users.email FROM auth.users WHERE auth.users.id = auth.uid()) IN (
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
    (SELECT auth.users.email FROM auth.users WHERE auth.users.id = auth.uid()) IN (
      'etienne.poulain@hito-digital.com',
      'benoit.civel@hito-digital.com',
      'vincent.ientile@hito-digital.com'
    )
  );
