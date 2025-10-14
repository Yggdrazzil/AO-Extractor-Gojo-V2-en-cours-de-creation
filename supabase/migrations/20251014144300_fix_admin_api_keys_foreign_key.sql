/*
  # Fix admin_api_keys foreign key constraint

  1. Changes
    - Add missing foreign key constraint to auth.users
    - This ensures user_id references a valid user in the auth.users table
  
  2. Security
    - Foreign key constraint prevents orphaned records
    - CASCADE DELETE ensures cleanup when user is deleted
  
  3. Notes
    - The original migration was supposed to create this constraint but it's missing
    - This fixes insertion errors due to invalid user_id references
*/

-- Add the foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'admin_api_keys_user_id_fkey'
  ) THEN
    ALTER TABLE admin_api_keys
    ADD CONSTRAINT admin_api_keys_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;
