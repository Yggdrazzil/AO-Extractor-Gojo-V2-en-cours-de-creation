/*
  # Fix authentication and RLS policies

  1. Changes
    - Enable email authentication
    - Update RLS policies for better access control
    - Add auth schema configurations
    
  2. Security
    - Proper RLS policies for authenticated users
    - Email authentication enabled
*/

-- Enable email authentication
ALTER SYSTEM SET auth.email.enable_signup = true;

-- Update RLS policies for better access control
ALTER TABLE rfps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON rfps;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON rfps;

-- Create new comprehensive RLS policies
CREATE POLICY "Enable full access for authenticated users"
ON rfps FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Enable auth schema for email/password auth
CREATE SCHEMA IF NOT EXISTS auth;
ALTER SCHEMA auth OWNER TO supabase_auth_admin;

-- Ensure the auth user has proper permissions
GRANT ALL PRIVILEGES ON SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO postgres;