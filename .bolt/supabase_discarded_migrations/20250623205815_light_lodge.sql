/*
  # Ajout des emails des commerciaux

  1. Modifications
    - Ajouter une colonne email à la table sales_reps
    - Mettre à jour les données existantes avec les emails au format prénom.nom@hito.digital
    - Ajouter une contrainte unique sur l'email

  2. Sécurité
    - Maintenir les politiques RLS existantes
*/

-- Ajouter la colonne email à la table sales_reps
ALTER TABLE sales_reps 
ADD COLUMN IF NOT EXISTS email text;

-- Mettre à jour les emails des commerciaux existants
-- Basé sur les codes commerciaux standards
UPDATE sales_reps SET email = 'etienne.poulain@hito.digital' WHERE code = 'EPO';

-- Ajouter d'autres commerciaux si nécessaire (exemples)
INSERT INTO sales_reps (name, code, email) VALUES 
  ('Ibrahim Khelladi', 'IKH', 'ibrahim.khelladi@hito.digital'),
  ('Benjamin Vivier', 'BVI', 'benjamin.vivier@hito.digital'),
  ('Guillaume Martin', 'GMA', 'guillaume.martin@hito.digital'),
  ('Thomas Saunier', 'TSA', 'thomas.saunier@hito.digital'),
  ('Bruno Cisse', 'BCI', 'bruno.cisse@hito.digital'),
  ('Vincent Ier', 'VIE', 'vincent.ier@hito.digital')
ON CONFLICT (code) DO UPDATE SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name;

-- Ajouter une contrainte unique sur l'email
ALTER TABLE sales_reps 
ADD CONSTRAINT IF NOT EXISTS sales_reps_email_unique UNIQUE (email);

-- Ajouter une contrainte pour s'assurer que l'email n'est pas null
ALTER TABLE sales_reps 
ALTER COLUMN email SET NOT NULL;