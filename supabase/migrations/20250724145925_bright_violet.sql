/*
  # Ajout de la colonne comments à la table prospects

  1. Nouvelles colonnes
    - `comments` (text) - Commentaires pour les prospects

  2. Sécurité
    - Utilisation de IF NOT EXISTS pour éviter les erreurs
    - Index pour optimiser les recherches

  3. Notes
    - Colonne optionnelle avec valeur par défaut vide
    - Compatible avec les données existantes
*/

-- Ajouter la colonne comments à la table prospects de manière sécurisée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospects' AND column_name = 'comments'
  ) THEN
    ALTER TABLE prospects ADD COLUMN comments text DEFAULT '' NOT NULL;
  END IF;
END $$;

-- Ajouter un index pour optimiser les recherches dans les commentaires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'prospects' AND indexname = 'idx_prospects_comments'
  ) THEN
    CREATE INDEX idx_prospects_comments ON prospects USING gin (to_tsvector('french', comments));
  END IF;
END $$;