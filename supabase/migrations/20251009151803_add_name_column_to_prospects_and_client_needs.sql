/*
  # Ajout de la colonne "name" (Prénom & Nom) aux tables prospects et client_needs

  ## Description
  Cette migration ajoute une colonne `name` aux tables `prospects` et `client_needs` pour stocker
  le prénom et nom du profil candidat. Cette information sera extraite automatiquement par ChatGPT
  depuis le champ "informations textuelles" lors de l'analyse.

  ## Changements
  
  ### Tables modifiées
  1. **prospects**
     - Ajout de la colonne `name` (text)
     - Valeur par défaut: '-' (tiret)
     - Position: après `target_account`, avant `availability`
  
  2. **client_needs**
     - Ajout de la colonne `name` (text)
     - Valeur par défaut: '-' (tiret)
     - Position: après `selected_need_title`, avant `availability`

  ## Notes importantes
  - La valeur par défaut '-' sera utilisée quand le prénom et nom ne sont pas fournis
  - Cette colonne sera automatiquement remplie par l'analyse OpenAI
  - Les commerciaux pourront modifier cette valeur manuellement dans le tableau
*/

-- Ajouter la colonne name à la table prospects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospects' AND column_name = 'name'
  ) THEN
    ALTER TABLE prospects ADD COLUMN name text DEFAULT '-';
  END IF;
END $$;

-- Ajouter la colonne name à la table client_needs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_needs' AND column_name = 'name'
  ) THEN
    ALTER TABLE client_needs ADD COLUMN name text DEFAULT '-';
  END IF;
END $$;