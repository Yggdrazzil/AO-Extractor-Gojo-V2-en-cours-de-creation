/*
  # Ajout des colonnes de commentaires

  1. Nouvelles colonnes
    - Ajoute `comments` (text) à la table `rfps`
    - Ajoute `comments` (text) à la table `prospects` 
    - Ajoute `comments` (text) à la table `client_needs`

  2. Configuration
    - Valeur par défaut : chaîne vide
    - Index de recherche textuelle en français
    - Compatible avec l'existant
*/

-- Ajouter la colonne comments à la table rfps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rfps' AND column_name = 'comments'
  ) THEN
    ALTER TABLE rfps ADD COLUMN comments text DEFAULT '' NOT NULL;
  END IF;
END $$;

-- Ajouter la colonne comments à la table prospects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospects' AND column_name = 'comments'
  ) THEN
    ALTER TABLE prospects ADD COLUMN comments text DEFAULT '' NOT NULL;
  END IF;
END $$;

-- Ajouter la colonne comments à la table client_needs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_needs' AND column_name = 'comments'
  ) THEN
    ALTER TABLE client_needs ADD COLUMN comments text DEFAULT '' NOT NULL;
  END IF;
END $$;

-- Créer des index pour la recherche textuelle en français
CREATE INDEX IF NOT EXISTS idx_rfps_comments 
ON rfps USING gin(to_tsvector('french', comments));

CREATE INDEX IF NOT EXISTS idx_prospects_comments 
ON prospects USING gin(to_tsvector('french', comments));

CREATE INDEX IF NOT EXISTS idx_client_needs_comments 
ON client_needs USING gin(to_tsvector('french', comments));