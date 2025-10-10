/*
  # Ajouter la colonne created_by aux tables pour tracer qui crée les enregistrements

  1. Modifications
    - Ajouter la colonne `created_by` à la table `rfps`
    - Ajouter la colonne `created_by` à la table `prospects`
    - Ajouter la colonne `created_by` à la table `client_needs`
    - La colonne contiendra l'UUID de l'utilisateur (sales_rep) qui a créé l'enregistrement
    - Valeur par défaut : auth.uid() (l'utilisateur connecté)
    
  2. Notes
    - Pour les enregistrements existants, on mettra created_by = assigned_to
    - created_by référence sales_reps.id (pas auth.users.id)
    - Cette colonne est nécessaire pour le système de notifications
*/

-- Ajouter created_by à rfps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rfps' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE rfps ADD COLUMN created_by uuid REFERENCES sales_reps(id);
    
    -- Pour les enregistrements existants, utiliser assigned_to comme created_by
    UPDATE rfps SET created_by = assigned_to WHERE created_by IS NULL;
    
    -- Rendre la colonne NOT NULL après avoir rempli les valeurs
    ALTER TABLE rfps ALTER COLUMN created_by SET NOT NULL;
  END IF;
END $$;

-- Ajouter created_by à prospects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospects' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE prospects ADD COLUMN created_by uuid REFERENCES sales_reps(id);
    
    -- Pour les enregistrements existants, utiliser assigned_to comme created_by
    UPDATE prospects SET created_by = assigned_to WHERE created_by IS NULL;
    
    -- Rendre la colonne NOT NULL après avoir rempli les valeurs
    ALTER TABLE prospects ALTER COLUMN created_by SET NOT NULL;
  END IF;
END $$;

-- Ajouter created_by à client_needs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_needs' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE client_needs ADD COLUMN created_by uuid REFERENCES sales_reps(id);
    
    -- Pour les enregistrements existants, utiliser assigned_to comme created_by
    UPDATE client_needs SET created_by = assigned_to WHERE created_by IS NULL;
    
    -- Rendre la colonne NOT NULL après avoir rempli les valeurs
    ALTER TABLE client_needs ALTER COLUMN created_by SET NOT NULL;
  END IF;
END $$;