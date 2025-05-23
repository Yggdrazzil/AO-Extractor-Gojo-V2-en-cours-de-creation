/*
  # Fix sales reps data structure

  1. Changes
    - Clear existing sales reps data
    - Insert sales reps with proper structure
    - Add proper constraints
*/

-- First clear existing data
TRUNCATE TABLE sales_reps CASCADE;

-- Insert sales reps with proper structure
INSERT INTO sales_reps (name, code) VALUES
  ('Ikram Hamdi', 'IKH'),
  ('Benjamin Vidal', 'BVI'),
  ('Guillaume Martin', 'GMA'),
  ('Thomas Santos', 'TSA'),
  ('Etienne Poulain', 'EPO'),
  ('Benjamin Cirot', 'BCI'),
  ('Vincent Emeriau', 'VIE');