/*
  # Correction de l'ordre des commerciaux
  
  1. Changements
    - Vide la table sales_reps
    - Réinsère les commerciaux dans l'ordre spécifié :
      1. IKH (Ikram Hamdi)
      2. BVI (Benjamin Vidal)
      3. GMA (Guillaume Martin)
      4. TSA (Thomas Santos)
      5. EPO (Etienne Poulain)
      6. BCI (Benjamin Cirot)
      7. VIE (Vincent Emeriau)
*/

-- Vider la table existante
TRUNCATE TABLE sales_reps CASCADE;

-- Insérer les commerciaux dans l'ordre exact spécifié
INSERT INTO sales_reps (name, code) VALUES
  ('Ikram Hamdi', 'IKH'),
  ('Benjamin Vidal', 'BVI'),
  ('Guillaume Martin', 'GMA'),
  ('Thomas Santos', 'TSA'),
  ('Etienne Poulain', 'EPO'),
  ('Benjamin Cirot', 'BCI'),
  ('Vincent Emeriau', 'VIE');