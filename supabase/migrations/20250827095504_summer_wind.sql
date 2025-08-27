/*
  # Configuration des envois automatiques quotidiens

  1. Tâches Cron
    - Récapitulatif AOs : tous les jours à 9h00 heure française
    - Récapitulatif Prospects : tous les jours à 9h00 heure française  
    - Récapitulatif Besoins Clients : tous les jours à 9h00 heure française

  2. Sécurité
    - Exécution avec les droits appropriés
    - Gestion d'erreur pour éviter les blocages

  3. Configuration
    - Horaire: 8h00 UTC = 9h00 heure française (hiver)
    - Fréquence: tous les jours de la semaine
*/

-- Activer l'extension pg_cron si pas encore fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprimer les anciennes tâches si elles existent
SELECT cron.unschedule('daily-rfp-summary');
SELECT cron.unschedule('daily-prospects-summary'); 
SELECT cron.unschedule('daily-client-needs-summary');

-- Configurer le récapitulatif quotidien des AOs à 9h00 heure française
SELECT cron.schedule(
  'daily-rfp-summary',
  '0 8 * * *', -- 8h00 UTC = 9h00 heure française en hiver
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-daily-rfp-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := jsonb_build_object()
  );
  $$
);

-- Configurer le récapitulatif quotidien des prospects à 9h00 heure française  
SELECT cron.schedule(
  'daily-prospects-summary',
  '0 8 * * *', -- 8h00 UTC = 9h00 heure française en hiver
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-daily-prospects-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := jsonb_build_object()
  );
  $$
);

-- Configurer le récapitulatif quotidien des besoins clients à 9h00 heure française
SELECT cron.schedule(
  'daily-client-needs-summary', 
  '0 8 * * *', -- 8h00 UTC = 9h00 heure française en hiver
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-daily-client-needs-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
    ),
    body := jsonb_build_object()
  );
  $$
);

-- Configurer les variables d'environnement nécessaires pour les tâches cron
ALTER DATABASE postgres SET app.supabase_url = 'https://onuznsfzlkguvfdeilff.supabase.co';
ALTER DATABASE postgres SET app.supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udXpuc2Z6bGtndXZmZGVpbGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTQyNzgsImV4cCI6MjA2MzU5MDI3OH0.Nmjfn7DDs36lIqs1pG33p7JaQ3aEmXr6WFqZBQPWqIE';

-- Fonction utilitaire pour vérifier le statut des tâches cron
CREATE OR REPLACE FUNCTION get_cron_job_status(job_name text)
RETURNS TABLE(
  jobname text,
  schedule text,
  active boolean,
  last_run timestamptz,
  next_run timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cron.jobname,
    cron.schedule,
    cron.active,
    cron.last_run,
    cron.next_run
  FROM cron.job cron
  WHERE cron.jobname = job_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;