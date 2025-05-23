/*
  # Add admin role to user

  1. Changes
    - Grant admin role to specific user
    - Update user metadata to include admin flag
*/

-- Update user's role to admin
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'etienne.poulain@hito.digital';

-- Update user's metadata to include admin flag
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'
)
WHERE email = 'etienne.poulain@hito.digital';