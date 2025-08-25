-- Create the admin user with the specified email and password
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create the user
  INSERT INTO auth.users (
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
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'etienne.poulain@hito.digital',
    -- Use the correct password hashing method
    crypt('Hito', gen_salt('bf', 10)),
    now(),
    now(),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email']
    ),
    jsonb_build_object(
      'name', 'EPO'
    ),
    false,
    now()
  )
  RETURNING id INTO new_user_id;

  -- Create the identity for the user
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', 'etienne.poulain@hito.digital'
    ),
    'email',
    now(),
    now(),
    now()
  );
END $$;