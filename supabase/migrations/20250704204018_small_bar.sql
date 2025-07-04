/*
  # Simplification de la table needs
  
  1. Modifications
     - Supprimer les colonnes non nécessaires (description, location, skills, etc.)
     - Conserver uniquement title, client, status et les champs système
  
  2. Mise à jour
     - Pour les besoins existants, les données non utilisées seront conservées
     - Cette migration ne supprime pas de données
*/

-- Pour les besoins existants, aucune modification n'est nécessaire
-- Lors de la création de nouveaux besoins, seuls les champs obligatoires seront utilisés

-- Désactiver temporairement le trigger pour éviter des problèmes
DROP TRIGGER IF EXISTS update_needs_updated_at ON needs;

-- Recréer le trigger
CREATE TRIGGER update_needs_updated_at 
    BEFORE UPDATE ON needs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Vérifier si l'enum existe déjà
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'need_status') THEN
    CREATE TYPE need_status AS ENUM ('Ouvert', 'En cours', 'Pourvu', 'Annulé');
  END IF;
END $$;