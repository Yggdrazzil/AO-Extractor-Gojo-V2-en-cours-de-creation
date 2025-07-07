/*
  # Add salary expectations to prospects and client_needs tables

  1. Changes
    - Add `salary_expectations` column to `prospects` table
    - Add `salary_expectations` column to `client_needs` table
    - Add indexes for the new columns
*/

-- Add salary_expectations column to prospects table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospects' AND column_name = 'salary_expectations'
  ) THEN
    ALTER TABLE prospects ADD COLUMN salary_expectations numeric;
    
    -- Create index for the new column
    CREATE INDEX IF NOT EXISTS idx_prospects_salary_expectations 
    ON prospects USING btree (salary_expectations);
    
    -- Add comment to the column
    COMMENT ON COLUMN prospects.salary_expectations IS 'Prétentions salariales annuelles en K€';
  END IF;
END $$;

-- Add salary_expectations column to client_needs table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_needs' AND column_name = 'salary_expectations'
  ) THEN
    ALTER TABLE client_needs ADD COLUMN salary_expectations numeric;
    
    -- Create index for the new column
    CREATE INDEX IF NOT EXISTS idx_client_needs_salary_expectations 
    ON client_needs USING btree (salary_expectations);
    
    -- Add comment to the column
    COMMENT ON COLUMN client_needs.salary_expectations IS 'Prétentions salariales annuelles en K€';
  END IF;
END $$;