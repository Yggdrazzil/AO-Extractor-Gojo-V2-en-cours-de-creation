/*
  # Trigger d'envoi d'email pour les nouveaux AO

  1. Fonction trigger
    - Déclenche l'envoi d'email automatique lors de l'insertion d'un nouvel AO
    - Appelle la edge function de notification par email
    
  2. Trigger
    - Se déclenche AFTER INSERT sur la table rfps
    - Envoie les données du nouvel AO à la fonction d'email
*/

-- Créer la fonction trigger pour l'envoi d'email
CREATE OR REPLACE FUNCTION send_rfp_email_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Appeler la edge function pour envoyer l'email
  PERFORM
    net.http_post(
      url := (SELECT value FROM vault.secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/send-rfp-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM vault.secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      body := jsonb_build_object('record', to_jsonb(NEW))
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger qui se déclenche après l'insertion d'un nouvel AO
CREATE OR REPLACE TRIGGER rfp_email_notification_trigger
  AFTER INSERT ON rfps
  FOR EACH ROW
  EXECUTE FUNCTION send_rfp_email_notification();

-- Ajouter un commentaire pour documenter le trigger
COMMENT ON TRIGGER rfp_email_notification_trigger ON rfps IS 
'Déclenche automatiquement l''envoi d''un email de notification au commercial assigné lors de la création d''un nouvel AO';