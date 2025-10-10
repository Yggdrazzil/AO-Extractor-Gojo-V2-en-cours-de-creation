/*
  # Système de notifications pour nouveaux enregistrements uniquement

  1. Modifications
    - Supprimer l'ancienne table et ses triggers
    - Créer une nouvelle table pour les notifications de nouveaux enregistrements
    - Ajouter une colonne pour l'utilisateur qui a créé l'enregistrement
    - Types de notifications : 
      * new_rfp : Nouvel AO attribué
      * new_prospect : Nouveau profil pour prise de références
      * new_client_need : Nouveau profil pour besoin client
      
  2. Sécurité
    - RLS activé : chaque commercial ne voit que ses propres notifications
    - Policy pour lecture de ses propres notifications
    - Policy pour marquage comme lu

  3. Structure de notification
    - Pour RFP : "{TRIGRAM} vous a attribué un nouvel AO : {Client} - {Mission}"
    - Pour Prospect : "{TRIGRAM} vous a attribué un nouveau profil pour prise de références chez {Client}"
    - Pour Client Need : "{TRIGRAM} vous a attribué un nouveau profil pour l'un de vos besoins client : {Besoin} - {Client} - {Nom}"
*/

-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS prospects_status_notification ON prospects;
DROP TRIGGER IF EXISTS rfps_status_notification ON rfps;
DROP TRIGGER IF EXISTS client_needs_status_notification ON client_needs;

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS create_status_notification();

-- Supprimer l'ancienne table
DROP TABLE IF EXISTS status_change_notifications;

-- Créer la nouvelle table des notifications
CREATE TABLE IF NOT EXISTS new_record_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  notification_type text NOT NULL,
  assigned_to uuid NOT NULL,
  created_by uuid NOT NULL,
  creator_trigram text NOT NULL,
  creator_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false,
  CONSTRAINT valid_table_name CHECK (table_name IN ('prospects', 'rfps', 'client_needs')),
  CONSTRAINT valid_notification_type CHECK (notification_type IN ('new_rfp', 'new_prospect', 'new_client_need'))
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_new_record_notifications_assigned_to ON new_record_notifications(assigned_to);
CREATE INDEX IF NOT EXISTS idx_new_record_notifications_created_at ON new_record_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_new_record_notifications_is_read ON new_record_notifications(is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE new_record_notifications ENABLE ROW LEVEL SECURITY;

-- Policy : Chaque commercial ne voit que ses propres notifications
CREATE POLICY "Users can view their own notifications"
  ON new_record_notifications
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

-- Policy : Les utilisateurs peuvent marquer leurs propres notifications comme lues
CREATE POLICY "Users can mark their own notifications as read"
  ON new_record_notifications
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Fonction pour créer une notification lors d'un nouvel ajout
CREATE OR REPLACE FUNCTION notify_new_record()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_trigram text;
  v_creator_name text;
  v_notification_type text;
  v_message text;
  v_client_name text;
BEGIN
  -- Ne créer une notification que si le créateur et l'assigné sont différents
  IF NEW.assigned_to = NEW.created_by THEN
    RETURN NEW;
  END IF;

  -- Récupérer les infos du créateur
  SELECT trigram, name INTO v_creator_trigram, v_creator_name
  FROM sales_reps
  WHERE id = NEW.created_by;

  -- Si pas de trigramme, utiliser le code ou les initiales du nom
  IF v_creator_trigram IS NULL THEN
    SELECT code INTO v_creator_trigram
    FROM sales_reps
    WHERE id = NEW.created_by;
  END IF;

  -- Construire le message selon le type de table
  IF TG_TABLE_NAME = 'rfps' THEN
    v_notification_type := 'new_rfp';
    v_message := v_creator_trigram || ' vous a attribué un nouvel AO : ' || NEW.client || ' - ' || NEW.mission;
    
  ELSIF TG_TABLE_NAME = 'prospects' THEN
    v_notification_type := 'new_prospect';
    v_client_name := COALESCE(NEW.client_name, 'Client non spécifié');
    v_message := v_creator_trigram || ' vous a attribué un nouveau profil pour prise de références chez ' || v_client_name;
    
  ELSIF TG_TABLE_NAME = 'client_needs' THEN
    v_notification_type := 'new_client_need';
    -- Format : Besoin + Client + Nom si disponible
    v_message := v_creator_trigram || ' vous a attribué un nouveau profil pour l''un de vos besoins client : ' || 
                 NEW.selected_need_title;
    
    IF NEW.client_name IS NOT NULL AND NEW.client_name != '' THEN
      v_message := v_message || ' - ' || NEW.client_name;
    END IF;
    
    IF NEW.name IS NOT NULL AND NEW.name != '' THEN
      v_message := v_message || ' - ' || NEW.name;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Créer la notification
  INSERT INTO new_record_notifications (
    table_name,
    record_id,
    notification_type,
    assigned_to,
    created_by,
    creator_trigram,
    creator_name,
    message
  ) VALUES (
    TG_TABLE_NAME,
    NEW.id,
    v_notification_type,
    NEW.assigned_to,
    NEW.created_by,
    v_creator_trigram,
    v_creator_name,
    v_message
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers sur les trois tables (uniquement sur INSERT)
DROP TRIGGER IF EXISTS prospects_new_record_notification ON prospects;
CREATE TRIGGER prospects_new_record_notification
  AFTER INSERT ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_record();

DROP TRIGGER IF EXISTS rfps_new_record_notification ON rfps;
CREATE TRIGGER rfps_new_record_notification
  AFTER INSERT ON rfps
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_record();

DROP TRIGGER IF EXISTS client_needs_new_record_notification ON client_needs;
CREATE TRIGGER client_needs_new_record_notification
  AFTER INSERT ON client_needs
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_record();