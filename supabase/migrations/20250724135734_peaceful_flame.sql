/*
  # Ajout de la colonne comments à la table rfps

  1. Modification de table
    - Ajouter la colonne `comments` à la table `rfps`
    - Type : TEXT avec valeur par défaut vide
    - Nullable pour compatibilité

  2. Sécurité
    - Utilise DO $$ BEGIN ... END $$ pour vérifier l'existence
    - N'ajoute la colonne que si elle n'existe pas déjà
    - Pas de rupture si la colonne existe déjà

  3. Performance
    - Pas d'index nécessaire pour ce champ
    - Colonne nullable pour éviter les migrations lourdes
*/

DO $$
BEGIN
  -- Vérifier si la colonne comments existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rfps' AND column_name = 'comments'
  ) THEN
    -- Ajouter la colonne comments
    ALTER TABLE rfps ADD COLUMN comments TEXT DEFAULT '';
    
    -- Log pour confirmer l'ajout
    RAISE NOTICE 'Colonne comments ajoutée à la table rfps';
  ELSE
    RAISE NOTICE 'Colonne comments existe déjà dans la table rfps';
  END IF;
END $$;