/*
  # Mise à jour du trigger de notification email

  1. Modifications
    - Supprimer l'ancien trigger et fonction
    - Créer une nouvelle fonction simplifiée qui utilise les emails stockés en base
    - Recréer le trigger

  2. Fonctionnement
    - Récupère l'email directement depuis la table sales_reps
    - Appelle la edge function avec les bonnes données
*/

-- Supprimer l'ancien trigger et fonction
DROP TRIGGER IF EXISTS rfp_email_notification_trigger ON rfps;
DROP FUNCTION IF EXISTS send_rfp_email_notification();

-- Créer la nouvelle fonction de notification
CREATE OR REPLACE FUNCTION send_rfp_email_notification()
RETURNS TRIGGER AS $$
DECLARE
  sales_rep_record RECORD;
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Récupérer les informations du commercial
  SELECT code, email INTO sales_rep_record
  FROM sales_reps
  WHERE id = NEW.assigned_to;
  
  -- Vérifier que le commercial existe
  IF sales_rep_record IS NULL THEN
    RAISE WARNING 'Sales rep not found for ID: %', NEW.assigned_to;
    RETURN NEW;
  END IF;
  
  -- Récupérer les variables d'environnement
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);
  
  -- Vérifier que les variables sont configurées
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RAISE WARNING 'Supabase configuration missing for email notification';
    RETURN NEW;
  END IF;
  
  -- Appeler la edge function de manière asynchrone (non bloquante)
  PERFORM
    net.http_post(
      url := supabase_url || '/functions/v1/send-rfp-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'rfpId', NEW.id,
        'client', NEW.client,
        'mission', NEW.mission,
        'salesRepCode', sales_rep_record.code,
        'assignedTo', NEW.assigned_to
      )
    );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, on log mais on n'interrompt pas l'insertion
    RAISE WARNING 'Failed to send email notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table rfps
CREATE TRIGGER rfp_email_notification_trigger
  AFTER INSERT ON rfps
  FOR EACH ROW
  EXECUTE FUNCTION send_rfp_email_notification();