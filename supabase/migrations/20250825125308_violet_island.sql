/*
  # Ajout des colonnes comments pour le système de commentaires

  1. Nouvelles colonnes
    - `comments` dans la table `rfps`
    - `comments` dans la table `prospects` (si pas déjà présente)
    - `comments` dans la table `client_needs` (si pas déjà présente)

  2. Index pour optimiser les recherches
    - Index GIN pour la recherche textuelle dans les commentaires

  3. Sécurité
    - Pas de changement RLS nécessaire (colonnes ajoutées à des tables existantes)
*/

-- Ajouter la colonne comments à la table rfps si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rfps' AND column_name = 'comments'
  ) THEN
    ALTER TABLE rfps ADD COLUMN comments text DEFAULT '' NOT NULL;
  END IF;
END $$;

-- Ajouter la colonne comments à la table prospects si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospects' AND column_name = 'comments'
  ) THEN
    ALTER TABLE prospects ADD COLUMN comments text DEFAULT '' NOT NULL;
  END IF;
END $$;

-- Ajouter la colonne comments à la table client_needs si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_needs' AND column_name = 'comments'
  ) THEN
    ALTER TABLE client_needs ADD COLUMN comments text DEFAULT '' NOT NULL;
  END IF;
END $$;

-- Créer des index pour optimiser la recherche dans les commentaires
CREATE INDEX IF NOT EXISTS idx_rfps_comments ON rfps USING gin (to_tsvector('french', comments));
CREATE INDEX IF NOT EXISTS idx_prospects_comments ON prospects USING gin (to_tsvector('french', comments));
CREATE INDEX IF NOT EXISTS idx_client_needs_comments ON client_needs USING gin (to_tsvector('french', comments));