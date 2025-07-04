/*
  # Système de gestion des besoins internes

  1. Nouvelle table
    - `needs` pour stocker les besoins clients
      - `id` (uuid, primary key)
      - `title` (text, required) - Titre du besoin
      - `client` (text, required) - Nom du client
      - `description` (text, optional) - Description détaillée
      - `location` (text, optional) - Localisation
      - `skills` (text, optional) - Compétences requises
      - `max_rate` (numeric, optional) - TJM maximum
      - `start_date` (date, optional) - Date de démarrage souhaitée
      - `end_date` (date, optional) - Date de fin souhaitée
      - `status` (enum) - Statut du besoin
      - `created_by` (uuid, foreign key) - Qui a créé le besoin
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Enum pour les statuts
    - Ouvert, En cours, Pourvu, Annulé

  3. Sécurité
    - Enable RLS sur la table needs
    - Politiques pour permettre CRUD aux utilisateurs authentifiés
*/

-- Création de l'enum pour les statuts des besoins
CREATE TYPE need_status AS ENUM ('Ouvert', 'En cours', 'Pourvu', 'Annulé');

-- Création de la table needs
CREATE TABLE IF NOT EXISTS needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  client text NOT NULL,
  description text DEFAULT '',
  location text DEFAULT '',
  skills text DEFAULT '',
  max_rate numeric DEFAULT NULL,
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL,
  status need_status DEFAULT 'Ouvert',
  created_by uuid NOT NULL REFERENCES sales_reps(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_needs_status ON needs(status);
CREATE INDEX IF NOT EXISTS idx_needs_created_by ON needs(created_by);
CREATE INDEX IF NOT EXISTS idx_needs_client ON needs(client);
CREATE INDEX IF NOT EXISTS idx_needs_start_date ON needs(start_date);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at sur needs
CREATE TRIGGER update_needs_updated_at 
    BEFORE UPDATE ON needs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS pour needs
CREATE POLICY "Allow authenticated users to view needs"
  ON needs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert needs"
  ON needs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update needs"
  ON needs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete needs"
  ON needs
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);