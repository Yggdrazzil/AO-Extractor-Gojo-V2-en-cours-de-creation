/*
  # Mise à jour des informations commerciaux avec emails corrects

  1. Corrections des noms et emails
    - IKH = Imane Khinache → imane.khinache@hito.digital
    - BVI = Benjamin Vives → benjamin.vives@hito.digital
    - BCI = Benoit Civel → benoit.civel@hito.digital
    - VIE = Vincent Ientile → vincent.ientile@hito.digital
    - GMA = Guillaume Manuel → guillaume.manuel@hito.digital
    - TSA = Thibaut Sage → thibaut.sage@hito.digital
    - EPO = Etienne Poulain → etienne.poulain@hito.digital

  2. Ajout nouveau commercial
    - JVO = Jordan Vogel → jordan.vogel@hito.digital

  3. Droits administrateur
    - Ajout colonne is_admin pour EPO
*/

-- Ajouter la colonne email si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_reps' AND column_name = 'email'
  ) THEN
    ALTER TABLE sales_reps ADD COLUMN email text UNIQUE;
  END IF;
END $$;

-- Ajouter la colonne is_admin pour les droits administrateur
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_reps' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE sales_reps ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Mettre à jour les informations existantes avec les bonnes données
UPDATE sales_reps SET 
  name = 'Imane Khinache',
  email = 'imane.khinache@hito.digital'
WHERE code = 'IKH';

UPDATE sales_reps SET 
  name = 'Benjamin Vives',
  email = 'benjamin.vives@hito.digital'
WHERE code = 'BVI';

UPDATE sales_reps SET 
  name = 'Benoit Civel',
  email = 'benoit.civel@hito.digital'
WHERE code = 'BCI';

UPDATE sales_reps SET 
  name = 'Vincent Ientile',
  email = 'vincent.ientile@hito.digital'
WHERE code = 'VIE';

UPDATE sales_reps SET 
  name = 'Guillaume Manuel',
  email = 'guillaume.manuel@hito.digital'
WHERE code = 'GMA';

UPDATE sales_reps SET 
  name = 'Thibaut Sage',
  email = 'thibaut.sage@hito.digital'
WHERE code = 'TSA';

UPDATE sales_reps SET 
  name = 'Etienne Poulain',
  email = 'etienne.poulain@hito.digital',
  is_admin = true
WHERE code = 'EPO';

-- Ajouter le nouveau commercial Jordan Vogel
INSERT INTO sales_reps (name, code, email, is_admin)
VALUES ('Jordan Vogel', 'JVO', 'jordan.vogel@hito.digital', false)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  is_admin = EXCLUDED.is_admin;

-- Ajouter une contrainte pour s'assurer que l'email est unique
ALTER TABLE sales_reps ADD CONSTRAINT unique_sales_rep_email UNIQUE (email);

-- Créer un index sur is_admin pour les requêtes de vérification des droits
CREATE INDEX IF NOT EXISTS idx_sales_reps_is_admin ON sales_reps(is_admin);