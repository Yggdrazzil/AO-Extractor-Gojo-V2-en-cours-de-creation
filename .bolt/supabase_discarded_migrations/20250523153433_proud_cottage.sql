/*
  # Add admin user profile

  1. Changes
    - Add admin user (EPO) to auth.users
    - Set up user metadata and email
    - Configure password
*/

-- Create the admin user with the specified email and password
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmed_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'etienne.poulain@hito.digital',
  crypt('Hito', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"EPO"}',
  false,
  now()
);

-- Ensure the user has the correct role
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  id,
  format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
  'email',
  now(),
  now(),
  now()
FROM auth.users
WHERE email = 'etienne.poulain@hito.digital';