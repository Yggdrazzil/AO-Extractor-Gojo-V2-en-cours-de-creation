/*
  # Système de notifications de changements de statut

  1. Nouvelle table
    - `status_change_notifications`
      - `id` (uuid, primary key)
      - `table_name` (text) - nom de la table (prospects, rfps, client_needs)
      - `record_id` (uuid) - ID de l'enregistrement modifié
      - `change_type` (text) - type de changement (status_to_traite, marked_as_read)
      - `old_value` (text) - ancienne valeur
      - `new_value` (text) - nouvelle valeur
      - `changed_by` (uuid) - commercial qui a fait le changement
      - `sales_rep_name` (text) - nom du commercial
      - `sales_rep_code` (text) - code du commercial
      - `record_summary` (text) - résumé de l'enregistrement (pour affichage)
      - `created_at` (timestamptz) - date de la notification
      - `is_read` (boolean) - notification lue ou non
      
  2. Sécurité
    - Enable RLS
    - Policy pour lecture par tous les commerciaux authentifiés
    - Policy pour marquage comme lu

  3. Triggers
    - Trigger sur prospects pour détecter les changements de status et is_read
    - Trigger sur rfps pour détecter les changements de status et is_read
    - Trigger sur client_needs pour détecter les changements de status et is_read
*/

-- Créer la table des notifications
CREATE TABLE IF NOT EXISTS status_change_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  change_type text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid NOT NULL,
  sales_rep_name text NOT NULL,
  sales_rep_code text NOT NULL,
  record_summary text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false,
  CONSTRAINT valid_table_name CHECK (table_name IN ('prospects', 'rfps', 'client_needs')),
  CONSTRAINT valid_change_type CHECK (change_type IN ('status_to_traite', 'marked_as_read'))
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_status_notifications_created_at ON status_change_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_notifications_is_read ON status_change_notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_status_notifications_changed_by ON status_change_notifications(changed_by);

-- Enable RLS
ALTER TABLE status_change_notifications ENABLE ROW LEVEL SECURITY;

-- Policy : Tous les commerciaux authentifiés peuvent lire les notifications
CREATE POLICY "Authenticated users can view all notifications"
  ON status_change_notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy : Les utilisateurs authentifiés peuvent marquer comme lues
CREATE POLICY "Authenticated users can mark as read"
  ON status_change_notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_sales_rep_name text;
  v_sales_rep_code text;
  v_record_summary text;
  v_change_type text;
  v_old_value text;
  v_new_value text;
BEGIN
  -- Récupérer les infos du commercial
  SELECT name, code INTO v_sales_rep_name, v_sales_rep_code
  FROM sales_reps
  WHERE id = NEW.assigned_to;

  -- Détecter le type de changement
  -- 1. Changement de status vers "Traité"
  IF TG_TABLE_NAME = 'prospects' AND OLD.status != NEW.status AND NEW.status = 'Traité' THEN
    v_change_type := 'status_to_traite';
    v_old_value := OLD.status;
    v_new_value := NEW.status;
    v_record_summary := COALESCE(NEW.file_name, 'Profil sans nom');
    
  ELSIF TG_TABLE_NAME = 'rfps' AND OLD.status != NEW.status AND NEW.status = 'Traité' THEN
    v_change_type := 'status_to_traite';
    v_old_value := OLD.status::text;
    v_new_value := NEW.status::text;
    v_record_summary := NEW.client || ' - ' || NEW.mission;
    
  ELSIF TG_TABLE_NAME = 'client_needs' AND OLD.status != NEW.status AND NEW.status = 'Traité' THEN
    v_change_type := 'status_to_traite';
    v_old_value := OLD.status;
    v_new_value := NEW.status;
    v_record_summary := NEW.selected_need_title;
    
  -- 2. Marqué comme lu
  ELSIF OLD.is_read = false AND NEW.is_read = true THEN
    v_change_type := 'marked_as_read';
    v_old_value := 'Non lu';
    v_new_value := 'Lu';
    
    IF TG_TABLE_NAME = 'prospects' THEN
      v_record_summary := COALESCE(NEW.file_name, 'Profil sans nom');
    ELSIF TG_TABLE_NAME = 'rfps' THEN
      v_record_summary := NEW.client || ' - ' || NEW.mission;
    ELSIF TG_TABLE_NAME = 'client_needs' THEN
      v_record_summary := NEW.selected_need_title;
    END IF;
  ELSE
    -- Pas de notification à créer
    RETURN NEW;
  END IF;

  -- Créer la notification
  INSERT INTO status_change_notifications (
    table_name,
    record_id,
    change_type,
    old_value,
    new_value,
    changed_by,
    sales_rep_name,
    sales_rep_code,
    record_summary
  ) VALUES (
    TG_TABLE_NAME,
    NEW.id,
    v_change_type,
    v_old_value,
    v_new_value,
    NEW.assigned_to,
    v_sales_rep_name,
    v_sales_rep_code,
    v_record_summary
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers sur les trois tables
DROP TRIGGER IF EXISTS prospects_status_notification ON prospects;
CREATE TRIGGER prospects_status_notification
  AFTER UPDATE ON prospects
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.is_read IS DISTINCT FROM NEW.is_read)
  EXECUTE FUNCTION create_status_notification();

DROP TRIGGER IF EXISTS rfps_status_notification ON rfps;
CREATE TRIGGER rfps_status_notification
  AFTER UPDATE ON rfps
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.is_read IS DISTINCT FROM NEW.is_read)
  EXECUTE FUNCTION create_status_notification();

DROP TRIGGER IF EXISTS client_needs_status_notification ON client_needs;
CREATE TRIGGER client_needs_status_notification
  AFTER UPDATE ON client_needs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.is_read IS DISTINCT FROM NEW.is_read)
  EXECUTE FUNCTION create_status_notification();