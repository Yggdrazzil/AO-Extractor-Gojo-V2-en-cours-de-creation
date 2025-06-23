/*
  # Fonction de notification email pour les AO

  1. Fonction
    - `send_rfp_email_notification()` : Fonction trigger pour envoyer un email lors de la création d'un AO
  
  2. Trigger
    - Déclenche l'envoi d'email automatiquement après insertion d'un nouvel AO
  
  3. Sécurité
    - Fonction sécurisée avec gestion d'erreurs
    - N'interrompt pas l'insertion en cas d'échec d'envoi
*/

-- Fonction pour envoyer une notification email lors de la création d'un AO
CREATE OR REPLACE FUNCTION send_rfp_email_notification()
RETURNS TRIGGER AS $$
DECLARE
  sales_rep_code TEXT;
BEGIN
  -- Récupérer le code du commercial
  SELECT code INTO sales_rep_code
  FROM sales_reps
  WHERE id = NEW.assigned_to;
  
  -- Appeler la edge function de manière asynchrone (non bloquante)
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-rfp-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'rfpId', NEW.id,
        'client', NEW.client,
        'mission', NEW.mission,
        'salesRepCode', sales_rep_code,
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
DROP TRIGGER IF EXISTS rfp_email_notification_trigger ON rfps;
CREATE TRIGGER rfp_email_notification_trigger
  AFTER INSERT ON rfps
  FOR EACH ROW
  EXECUTE FUNCTION send_rfp_email_notification();