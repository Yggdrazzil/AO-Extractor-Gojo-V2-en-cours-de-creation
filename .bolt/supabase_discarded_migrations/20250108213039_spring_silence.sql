/*
  # Update sales representatives order

  1. Changes
    - Clear existing sales representatives
    - Insert sales representatives in specified order:
      1. IKH (Ikram Hamdi)
      2. BVI (Benjamin Vidal)
      3. GMA (Guillaume Martin)
      4. TSA (Thomas Santos)
      5. EPO (Etienne Poulain)
      6. BCI (Benjamin Cirot)
      7. VIE (Vincent Emeriau)
*/

-- First clear existing data
TRUNCATE TABLE sales_reps CASCADE;

-- Insert sales reps in specified order
INSERT INTO sales_reps (name, code) VALUES
  ('Ikram Hamdi', 'IKH'),
  ('Benjamin Vidal', 'BVI'),
  ('Guillaume Martin', 'GMA'),
  ('Thomas Santos', 'TSA'),
  ('Etienne Poulain', 'EPO'),
  ('Benjamin Cirot', 'BCI'),
  ('Vincent Emeriau', 'VIE');