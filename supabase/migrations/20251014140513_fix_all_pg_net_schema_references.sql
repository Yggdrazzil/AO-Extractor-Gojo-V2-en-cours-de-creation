/*
  # Fix all pg_net schema references

  1. Changes
    - Update all functions that use net.http_post to use extensions.http_post
    - Fixes "schema 'net' does not exist" error for all notification triggers
  
  2. Affected Functions
    - send_prospect_email_notification (prospects)
*/

-- Fix send_prospect_email_notification function
CREATE OR REPLACE FUNCTION send_prospect_email_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  sales_rep_record RECORD;
  supabase_url TEXT;
  service_role_key TEXT;
  request_id bigint;
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
    RAISE WARNING 'Supabase configuration missing for prospect email notification';
    RETURN NEW;
  END IF;
  
  -- Appeler la edge function de manière asynchrone (non bloquante) avec le bon schéma
  SELECT extensions.http_post(
    url := supabase_url || '/functions/v1/send-prospect-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'prospectId', NEW.id,
      'targetAccount', NEW.target_account,
      'salesRepCode', sales_rep_record.code,
      'assignedTo', NEW.assigned_to,
      'hasCV', CASE WHEN NEW.file_name IS NOT NULL THEN true ELSE false END,
      'fileName', NEW.file_name
    )
  ) INTO request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, on log mais on n'interrompt pas l'insertion
    RAISE WARNING 'Failed to send prospect email notification: %', SQLERRM;
    RETURN NEW;
END;
$$;
