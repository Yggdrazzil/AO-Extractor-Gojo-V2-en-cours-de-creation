/*
  # Ajout du système de commentaires pour les AOs

  1. Modifications de la table
    - Ajout d'une colonne `comments` dans la table `rfps`
    - Type text pour permettre des commentaires longs
    - Valeur par défaut vide

  2. Sécurité
    - Pas de modification des politiques RLS existantes
    - Les droits existants s'appliquent automatiquement
*/

-- Ajouter la colonne comments à la table rfps
ALTER TABLE rfps ADD COLUMN IF NOT EXISTS comments text DEFAULT '';

-- Ajouter un index pour optimiser les recherches de commentaires
CREATE INDEX IF NOT EXISTS idx_rfps_comments ON rfps USING gin (to_tsvector('french', comments));