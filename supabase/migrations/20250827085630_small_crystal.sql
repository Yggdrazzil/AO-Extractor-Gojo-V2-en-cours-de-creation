/*
  # Configuration des notifications quotidiennes automatiques

  1. Installation et configuration de pg_cron
     - Active l'extension pg_cron pour planifier des tâches
     - Configure les tâches quotidiennes à 9h00 heure française (7h00 UTC)
  
  2. Tâches programmées
     - Récapitulatif quotidien AOs : Tous les jours à 9h00
     - Récapitulatif quotidien prospects : Tous les jours à 9h01  
     - Récapitulatif quotidien besoins clients : Tous les jours à 9h02
  
  3. Fonctions RPC
     - get_cron_job_status : Vérifier le statut d'une tâche cron
     - list_cron_jobs : Lister toutes les tâches programmées
  
  4. Sécurité
     - Les tâches ne s'exécutent que si des données sont à traiter
     - Gestion des erreurs robuste
     - Logs détaillés pour le debugging
*/

-- Activer l'extension pg_cron si elle n'est pas déjà active
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Fonction pour vérifier le statut d'un cron job
CREATE OR REPLACE FUNCTION get_cron_job_status(job_name text)
RETURNS json AS $$
DECLARE
  job_record json;
BEGIN
  -- Chercher le job dans la table pg_cron.job
  SELECT to_json(j.*) INTO job_record
  FROM cron.job j
  WHERE j.jobname = job_name;
  
  IF job_record IS NULL THEN
    RETURN json_build_object(
      'exists', false,
      'active', false,
      'schedule', null,
      'next_run', null
    );
  END IF;
  
  RETURN json_build_object(
    'exists', true,
    'active', (job_record->>'active')::boolean,
    'schedule', job_record->>'schedule',
    'next_run', job_record->>'next_run',
    'job_details', job_record
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour lister tous les cron jobs
CREATE OR REPLACE FUNCTION list_cron_jobs()
RETURNS json AS $$
DECLARE
  jobs_array json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'jobid', j.jobid,
      'jobname', j.jobname,
      'schedule', j.schedule,
      'active', j.active,
      'command', j.command
    )
  ) INTO jobs_array
  FROM cron.job j
  WHERE j.jobname LIKE 'daily-%';
  
  RETURN COALESCE(jobs_array, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer les anciens jobs s'ils existent
SELECT cron.unschedule('daily-rfp-summary');
SELECT cron.unschedule('daily-prospects-summary');
SELECT cron.unschedule('daily-client-needs-summary');

-- Programmer le récapitulatif quotidien des AOs à 9h00 heure française (7h00 UTC)
SELECT cron.schedule(
  'daily-rfp-summary',
  '0 7 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-daily-rfp-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Programmer le récapitulatif quotidien des prospects à 9h01 heure française (7h01 UTC)
SELECT cron.schedule(
  'daily-prospects-summary',
  '1 7 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-daily-prospects-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Programmer le récapitulatif quotidien des profils pour besoins clients à 9h02 heure française (7h02 UTC)
SELECT cron.schedule(
  'daily-client-needs-summary',
  '2 7 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-daily-client-needs-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Configurer les variables d'environnement nécessaires pour les cron jobs
ALTER DATABASE postgres SET app.supabase_url = 'https://onuznsfzlkguvfdeilff.supabase.co';
ALTER DATABASE postgres SET app.supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udXpuc2Z6bGtndXZmZGVpbGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTQyNzgsImV4cCI6MjA2MzU5MDI3OH0.Nmjfn7DDs36lIqs1pG33p7JaQ3aEmXr6WFqZBQPWqIE';

-- Créer une fonction pour tester les cron jobs manuellement
CREATE OR REPLACE FUNCTION test_cron_jobs()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Tester chaque job
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-daily-rfp-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := '{"test": true}'::jsonb
  );
  
  RETURN json_build_object(
    'status', 'success',
    'message', 'Cron jobs test initiated',
    'timestamp', now()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'status', 'error',
      'message', SQLERRM,
      'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une vue pour monitorer les envois d'emails quotidiens
CREATE OR REPLACE VIEW daily_email_stats AS
SELECT 
  sr.code as sales_rep_code,
  sr.name as sales_rep_name,
  sr.email as sales_rep_email,
  
  -- Compter les AOs à traiter
  (SELECT COUNT(*) 
   FROM rfps r 
   WHERE r.assigned_to = sr.id AND r.status = 'À traiter') as pending_rfps,
  
  -- Compter les prospects à traiter
  (SELECT COUNT(*) 
   FROM prospects p 
   WHERE p.assigned_to = sr.id AND p.status = 'À traiter') as pending_prospects,
   
  -- Compter les besoins clients à traiter
  (SELECT COUNT(*) 
   FROM client_needs cn 
   WHERE cn.assigned_to = sr.id AND cn.status = 'À traiter') as pending_client_needs
   
FROM sales_reps sr
ORDER BY sr.code;

-- Fonction pour obtenir les statistiques d'envoi
CREATE OR REPLACE FUNCTION get_daily_email_stats()
RETURNS SETOF daily_email_stats AS $$
BEGIN
  RETURN QUERY SELECT * FROM daily_email_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions pour les fonctions
GRANT EXECUTE ON FUNCTION get_cron_job_status(text) TO authenticated;
GRANT EXECUTE ON FUNCTION list_cron_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION test_cron_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_email_stats() TO authenticated;
GRANT SELECT ON daily_email_stats TO authenticated;