/*
  # Réorganisation des commerciaux

  1. Changements
    - Vide la table sales_reps
    - Réinsère les commerciaux dans l'ordre spécifié :
      1. IKH
      2. BVI
      3. GMA
      4. TSA
      5. EPO
      6. BCI
      7. VIE
*/

-- Vider la table existante
TRUNCATE TABLE sales_reps CASCADE;

-- Insérer les commerciaux dans l'ordre spécifié
INSERT INTO sales_reps (name, code) VALUES
  ('Ikram Hamdi', 'IKH'),
  ('Benjamin Vidal', 'BVI'),
  ('Guillaume Martin', 'GMA'),
  ('Thomas Santos', 'TSA'),
  ('Etienne Poulain', 'EPO'),
  ('Benjamin Cirot', 'BCI'),
  ('Vincent Emeriau', 'VIE');