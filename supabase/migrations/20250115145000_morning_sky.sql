/*
  # Update RFP date permissions

  1. Changes
    - Add explicit permissions for updating start_date and created_at columns
    - Ensure columns are nullable
    - Update RLS policies for date modifications
*/

-- 1. Vérifier les permissions sur les colonnes
SELECT column_name, is_nullable, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'rfps'
  AND column_name IN ('start_date', 'created_at');

-- 2. Vérifier les politiques RLS existantes
SELECT pol.policyname, pol.permissive, pol.cmd, pol.qual
FROM pg_policies pol
WHERE pol.tablename = 'rfps';

-- 3. Mettre à jour les politiques si nécessaire
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON rfps;

CREATE POLICY "Enable update access for authenticated users"
ON rfps FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. S'assurer que les colonnes sont modifiables
ALTER TABLE rfps 
  ALTER COLUMN start_date DROP NOT NULL,
  ALTER COLUMN created_at DROP NOT NULL;

-- 5. Accorder explicitement les permissions de mise à jour
GRANT UPDATE(start_date, created_at) ON rfps TO authenticated;