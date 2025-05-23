/*
  # Mise à jour des statuts RFP

  1. Modifications
    - Modification du type enum rfp_status pour ne garder que 'À traiter' et 'Traité'
    - Mise à jour des données existantes
    - Ajout de contraintes pour assurer la validité des données

  2. Sécurité
    - Conservation des politiques RLS existantes
*/

-- Créer un nouveau type enum avec les seuls statuts valides
CREATE TYPE rfp_status_new AS ENUM ('À traiter', 'Traité');

-- Convertir les données existantes
UPDATE rfps 
SET status = CASE 
  WHEN status::text = 'En cours' THEN 'À traiter'
  WHEN status::text = 'Refusé' THEN 'Traité'
  ELSE status::text
END::rfp_status_new;

-- Supprimer l'ancien type et renommer le nouveau
DROP TYPE rfp_status CASCADE;
ALTER TYPE rfp_status_new RENAME TO rfp_status;

-- Recréer la colonne status avec le nouveau type
ALTER TABLE rfps
  ALTER COLUMN status TYPE rfp_status USING status::text::rfp_status,
  ALTER COLUMN status SET DEFAULT 'À traiter';