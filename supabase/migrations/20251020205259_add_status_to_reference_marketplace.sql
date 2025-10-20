/*
  # Add status column to reference_marketplace table

  1. Changes
    - Add `status` column to reference_marketplace table
      - Type: text
      - Default value: 'A traiter'
      - Constraint: must be 'A traiter' or 'Traité'
    
  2. Notes
    - Status will help track which references have been processed
    - Default status is 'A traiter' (To be processed)
    - Can be updated to 'Traité' (Processed)
*/

-- Add status column to reference_marketplace
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reference_marketplace' AND column_name = 'status'
  ) THEN
    ALTER TABLE reference_marketplace 
    ADD COLUMN status text DEFAULT 'A traiter' CHECK (status IN ('A traiter', 'Traité'));
  END IF;
END $$;