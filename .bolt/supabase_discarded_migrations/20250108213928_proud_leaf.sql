/*
  # Fix sales representatives order

  1. Changes
    - Clear existing sales representatives data
    - Insert sales reps in the specified order:
      IKH, BVI, GMA, TSA, EPO, BCI, VIE
    - Add migration tracking
*/

-- Check if this migration has already been applied
DO $$ 
BEGIN
  IF NOT has_migration_been_applied('20250108214000') THEN
    -- Clear existing data
    TRUNCATE TABLE sales_reps CASCADE;

    -- Insert sales reps in the specified order
    INSERT INTO sales_reps (name, code) VALUES
      ('Ikram Hamdi', 'IKH'),
      ('Benjamin Vidal', 'BVI'),
      ('Guillaume Martin', 'GMA'),
      ('Thomas Santos', 'TSA'),
      ('Etienne Poulain', 'EPO'),
      ('Benjamin Cirot', 'BCI'),
      ('Vincent Emeriau', 'VIE');

    -- Record that this migration has been applied
    INSERT INTO schema_migrations (version) VALUES ('20250108214000');
  END IF;
END $$;