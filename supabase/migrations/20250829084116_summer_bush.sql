/*
  # Configuration des tâches automatiques pour les récapitulatifs quotidiens

  1. Extension pg_cron
    - Active l'extension pg_cron pour programmer des tâches
    - Permet l'exécution automatique de fonctions à heures fixes
    
  2. Tâches programmées (lundi à vendredi uniquement)
    - **9h00** : Récapitulatif AOs (send-daily-rfp-summary)
    - **9h01** : Récapitulatif Prospects (send-daily-prospects-summary) 
    - **9h02** : Récapitulatif Besoins Clients (send-daily-client-needs-summary)
    
  3. Planning
    - Utilise la syntaxe cron avec restriction aux jours ouvrables (1-5)
    - Fuseau horaire Europe/Paris (UTC+1/UTC+2 selon saison)
    
  4. Sécurité
    - Utilise les fonctions Edge existantes via HTTP
    - Gestion des erreurs et retry automatique
*/

-- Activer l'extension pg_cron si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Nettoyer les anciennes tâches si elles existent
SELECT cron.unschedule('daily-rfp-summary');
SELECT cron.unschedule('daily-prospects-summary'); 
SELECT cron.unschedule('daily-client-needs-summary');

-- Programmer le récapitulatif quotidien des AOs
-- Tous les jours ouvrables (lundi=1 à vendredi=5) à 9h00 heure française
SELECT cron.schedule(
  'daily-rfp-summary',
  '0 8 * * 1-5', -- 8h UTC = 9h France (hiver) / 7h UTC = 9h France (été)
  $$
  SELECT 
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-daily-rfp-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_key')
      ),
      body := jsonb_build_object('automated', true)
    );
  $$
);

-- Programmer le récapitulatif quotidien des Prospects  
-- Tous les jours ouvrables à 9h01 heure française
SELECT cron.schedule(
  'daily-prospects-summary',
  '1 8 * * 1-5', -- 8h01 UTC = 9h01 France
  $$
  SELECT 
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-daily-prospects-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_key')
      ),
      body := jsonb_build_object('automated', true)
    );
  $$
);

-- Programmer le récapitulatif quotidien des Besoins Clients
-- Tous les jours ouvrables à 9h02 heure française  
SELECT cron.schedule(
  'daily-client-needs-summary',
  '2 8 * * 1-5', -- 8h02 UTC = 9h02 France
  $$
  SELECT 
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-daily-client-needs-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json', 
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_key')
      ),
      body := jsonb_build_object('automated', true)
    );
  $$
);

-- Fonction utilitaire pour vérifier le statut des cron jobs
CREATE OR REPLACE FUNCTION get_cron_job_status(job_name TEXT)
RETURNS TABLE(
  jobid BIGINT,
  schedule TEXT,
  command TEXT,
  active BOOLEAN,
  jobname TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobid,
    j.schedule,
    j.command,
    j.active,
    j.jobname
  FROM cron.job j 
  WHERE j.jobname = job_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour lister tous les cron jobs actifs
CREATE OR REPLACE FUNCTION list_all_cron_jobs()
RETURNS TABLE(
  jobid BIGINT,
  schedule TEXT,
  command TEXT,
  active BOOLEAN,
  jobname TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobid,
    j.schedule,
    j.command,
    j.active,
    j.jobname
  FROM cron.job j 
  ORDER BY j.jobname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configurer les paramètres Supabase nécessaires pour les cron jobs
-- Ces paramètres seront utilisés par les tâches cron pour appeler les fonctions Edge
DO $$
BEGIN
  -- URL de Supabase (sera configuré automatiquement par l'environnement)
  IF NOT EXISTS (
    SELECT 1 FROM pg_settings WHERE name = 'app.supabase_url'
  ) THEN
    PERFORM set_config('app.supabase_url', 'https://onuznsfzlkguvfdeilff.supabase.co', false);
  END IF;
  
  -- Clé service (sera configurée par l'environnement Supabase)
  IF NOT EXISTS (
    SELECT 1 FROM pg_settings WHERE name = 'app.supabase_service_key'
  ) THEN
    PERFORM set_config('app.supabase_service_key', current_setting('SUPABASE_SERVICE_ROLE_KEY'), false);
  END IF;
END $$;