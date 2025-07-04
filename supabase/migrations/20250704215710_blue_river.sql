-- Création de la table client_needs pour stocker les profils pour besoins clients
CREATE TABLE IF NOT EXISTS client_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text_content text,
  file_name text,
  file_url text,
  file_content text,
  selected_need_id text NOT NULL,
  selected_need_title text NOT NULL,
  availability text DEFAULT '-',
  daily_rate numeric DEFAULT NULL,
  residence text DEFAULT '-',
  mobility text DEFAULT '-',
  phone text DEFAULT '-',
  email text DEFAULT '-',
  status text DEFAULT 'À traiter',
  assigned_to uuid NOT NULL REFERENCES sales_reps(id),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_needs ENABLE ROW LEVEL SECURITY;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_client_needs_status ON client_needs(status);
CREATE INDEX IF NOT EXISTS idx_client_needs_assigned_to ON client_needs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_client_needs_is_read ON client_needs(is_read);
CREATE INDEX IF NOT EXISTS idx_client_needs_selected_need_id ON client_needs(selected_need_id);

-- Politiques RLS pour client_needs
CREATE POLICY "Enable read access for authenticated users"
  ON client_needs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON client_needs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users"
  ON client_needs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users"
  ON client_needs
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);