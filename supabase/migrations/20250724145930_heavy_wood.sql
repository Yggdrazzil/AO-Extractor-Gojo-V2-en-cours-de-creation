/*
  # Ajout de la colonne comments à la table client_needs

  1. Nouvelles colonnes
    - `comments` (text) - Commentaires pour les besoins clients

  2. Sécurité
    - Utilisation de IF NOT EXISTS pour éviter les erreurs
    - Index pour optimiser les recherches

  3. Notes
    - Colonne optionnelle avec valeur par défaut vide
    - Compatible avec les données existantes
*/

-- Ajouter la colonne comments à la table client_needs de manière sécurisée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_needs' AND column_name = 'comments'
  ) THEN
    ALTER TABLE client_needs ADD COLUMN comments text DEFAULT '' NOT NULL;
  END IF;
END $$;

-- Ajouter un index pour optimiser les recherches dans les commentaires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'client_needs' AND indexname = 'idx_client_needs_comments'
  ) THEN
    CREATE INDEX idx_client_needs_comments ON client_needs USING gin (to_tsvector('french', comments));
  END IF;
END $$;