/*
  # Ajouter le trigramme aux commerciaux

  1. Modifications
    - Ajouter la colonne `trigram` à la table `sales_reps`
    - Ajouter des trigrammes pour les commerciaux existants
*/

-- Ajouter la colonne trigram si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_reps' AND column_name = 'trigram'
  ) THEN
    ALTER TABLE sales_reps ADD COLUMN trigram text;
  END IF;
END $$;

-- Mettre à jour les trigrammes pour les commerciaux existants
UPDATE sales_reps SET trigram = 'BVI' WHERE email = 'benjamin.vives@hito.digital';
UPDATE sales_reps SET trigram = 'EPO' WHERE email = 'etienne.poulain@hito.digital';
UPDATE sales_reps SET trigram = 'GMA' WHERE email = 'guillaume.manuel@hito.digital';
UPDATE sales_reps SET trigram = 'IKH' WHERE email = 'imane.khinache@hito.digital';
UPDATE sales_reps SET trigram = 'TSA' WHERE email = 'thibaut.sage@hito.digital';
UPDATE sales_reps SET trigram = 'JVO' WHERE email = 'jordan.vogel@hito.digital';
UPDATE sales_reps SET trigram = 'BCI' WHERE email = 'benoit.civel@hito.digital';
UPDATE sales_reps SET trigram = 'VIE' WHERE email = 'vincent.ientile@hito.digital';