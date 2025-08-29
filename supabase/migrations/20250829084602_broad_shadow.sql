/*
  # Configuration du système de cron jobs pour les récapitulatifs quotidiens

  1. Configuration
    - Active l'extension pg_cron
    - Configure les tâches pour du lundi au vendredi uniquement
    - Horaires : 9h00, 9h01, 9h02 (heure française = UTC+1)

  2. Tâches programmées
    - daily-rfp-summary : Récapitulatifs des AOs (9h00)
    - daily-prospects-summary : Récapitulatifs des prospects (9h01)  
    - daily-client-needs-summary : Récapitulatifs des besoins clients (9h02)

  3. Fonctions RPC
    - list_all_cron_jobs : Liste toutes les tâches programmées
    - get_cron_job_status : Vérifie le statut d'une tâche spécifique
*/

-- Activer l'extension pg_cron si pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Nettoyer les anciens jobs s'ils existent
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('daily-rfp-summary', 'daily-prospects-summary', 'daily-client-needs-summary');

-- Configurer les tâches automatiques (du lundi au vendredi uniquement)
-- 9h00 français = 8h00 UTC (en hiver) / 7h00 UTC (en été)
-- Pour simplifier, on utilise 8h00 UTC qui correspond à 9h00 en hiver et 10h00 en été

-- 1. Récapitulatif AOs - 8h00 UTC du lundi au vendredi
SELECT cron.schedule(
  'daily-rfp-summary',
  '0 8 * * 1-5', 
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-daily-rfp-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
      ),
      body := jsonb_build_object('cron_trigger', true)
    );
  $$
);

-- 2. Récapitulatif Prospects - 8h01 UTC du lundi au vendredi  
SELECT cron.schedule(
  'daily-prospects-summary',
  '1 8 * * 1-5',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-daily-prospects-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
      ),
      body := jsonb_build_object('cron_trigger', true)
    );
  $$
);

-- 3. Récapitulatif Besoins Clients - 8h02 UTC du lundi au vendredi
SELECT cron.schedule(
  'daily-client-needs-summary',
  '2 8 * * 1-5',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-daily-client-needs-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
      ),
      body := jsonb_build_object('cron_trigger', true)
    );
  $$
);

-- Créer la fonction RPC pour lister les cron jobs
CREATE OR REPLACE FUNCTION list_all_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  active boolean,
  jobname text
)
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobid,
    j.schedule,
    j.command,
    j.active,
    j.jobname
  FROM cron.job j
  WHERE j.jobname IN ('daily-rfp-summary', 'daily-prospects-summary', 'daily-client-needs-summary')
  ORDER BY j.jobname;
EXCEPTION
  WHEN OTHERS THEN
    -- Si pg_cron n'est pas disponible, retourner une table vide
    RETURN;
END;
$$;

-- Créer la fonction RPC pour vérifier le statut d'un job spécifique
CREATE OR REPLACE FUNCTION get_cron_job_status(job_name text)
RETURNS TABLE (
  exists boolean,
  active boolean,
  schedule text,
  next_run timestamp
)
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (j.jobname IS NOT NULL) as exists,
    COALESCE(j.active, false) as active,
    j.schedule,
    NULL::timestamp as next_run  -- pg_cron ne fournit pas facilement la prochaine exécution
  FROM cron.job j
  WHERE j.jobname = job_name
  LIMIT 1;
  
  -- Si aucun job trouvé, retourner des valeurs par défaut
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, ''::text, NULL::timestamp;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner des valeurs par défaut
    RETURN QUERY SELECT false, false, ''::text, NULL::timestamp;
END;
$$;

-- Configurer les paramètres Supabase pour les cron jobs (si pas déjà fait)
-- Ces paramètres seront automatiquement disponibles via current_setting()
DO $$
BEGIN
  -- Note: Ces paramètres devront être configurés par l'administrateur Supabase
  -- ALTER DATABASE postgres SET app.supabase_url TO 'https://your-project.supabase.co';
  -- ALTER DATABASE postgres SET app.supabase_anon_key TO 'your-anon-key';
END $$;

-- Créer une fonction pour activer/désactiver les cron jobs
CREATE OR REPLACE FUNCTION toggle_cron_job(job_name text, enable boolean)
RETURNS boolean
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF enable THEN
    UPDATE cron.job SET active = true WHERE jobname = job_name;
  ELSE
    UPDATE cron.job SET active = false WHERE jobname = job_name;
  END IF;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;