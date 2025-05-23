/*
  # Add migrations tracking system

  1. New Tables
    - `schema_migrations`
      - `version` (text, primary key) - Migration version identifier
      - `applied_at` (timestamptz) - When the migration was applied
      
  2. Changes
    - Add table to track applied migrations
    - Add RLS policies for the new table
    - Add function to check if a migration has been applied
*/

-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    applied_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow read access to authenticated users"
    ON schema_migrations
    FOR SELECT
    TO authenticated
    USING (true);

-- Create helper function to check if a migration has been applied
CREATE OR REPLACE FUNCTION has_migration_been_applied(migration_version text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM schema_migrations
        WHERE version = migration_version
    );
END;
$$ LANGUAGE plpgsql;