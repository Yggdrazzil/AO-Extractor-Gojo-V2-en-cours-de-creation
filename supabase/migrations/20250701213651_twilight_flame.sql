/*
  # Ajout des colonnes pour les prétentions tarifaires et salariales

  1. Nouvelles colonnes
    - `salary_expectations` (numeric) - Prétentions salariales annuelles
    - `rate_expectations` (numeric) - Prétentions tarifaires (TJM)

  2. Migration des données
    - Copier les valeurs existantes de daily_rate vers rate_expectations
    - Garder daily_rate pour compatibilité

  3. Index
    - Ajouter des index pour les performances
*/

-- Ajouter les nouvelles colonnes
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS salary_expectations numeric,
ADD COLUMN IF NOT EXISTS rate_expectations numeric;

-- Migrer les données existantes : copier daily_rate vers rate_expectations
UPDATE prospects 
SET rate_expectations = daily_rate 
WHERE daily_rate IS NOT NULL AND rate_expectations IS NULL;

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_prospects_salary_expectations ON prospects(salary_expectations);
CREATE INDEX IF NOT EXISTS idx_prospects_rate_expectations ON prospects(rate_expectations);

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN prospects.salary_expectations IS 'Prétentions salariales annuelles en euros';
COMMENT ON COLUMN prospects.rate_expectations IS 'Prétentions tarifaires (TJM) en euros';