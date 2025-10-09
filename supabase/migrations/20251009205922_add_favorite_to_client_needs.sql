/*
  # Ajout de la fonctionnalité "Favori" pour les besoins clients

  ## Description
  Cette migration ajoute une colonne `is_favorite` à la table `client_needs` pour permettre
  aux utilisateurs de marquer certains besoins clients comme favoris.

  ## Changements
  
  ### Table modifiée: client_needs
  - Ajout de la colonne `is_favorite` (boolean)
  - Valeur par défaut: false
  - Cette colonne permettra de filtrer les besoins clients favoris dans l'interface

  ## Notes importantes
  - Les favoris sont spécifiques à chaque besoin client
  - La valeur par défaut false signifie que les besoins ne sont pas marqués comme favoris par défaut
*/

-- Ajouter la colonne is_favorite à la table client_needs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_needs' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE client_needs ADD COLUMN is_favorite boolean DEFAULT false NOT NULL;
  END IF;
END $$;