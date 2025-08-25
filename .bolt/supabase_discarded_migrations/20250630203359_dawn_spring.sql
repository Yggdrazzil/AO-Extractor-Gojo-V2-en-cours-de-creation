/*
  # Configuration du système de mail quotidien récapitulatif

  1. Extension pg_cron
    - Active l'extension pg_cron pour programmer des tâches
    
  2. Tâche quotidienne
    - Programme l'envoi des emails récapitulatifs à 9h00 (heure française)
    - Utilise la fonction Edge pour envoyer les emails
    
  3. Sécurité
    - La tâche s'exécute avec les permissions appropriées
*/

-- Activer l'extension pg_cron si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprimer la tâche existante si elle existe déjà
SELECT cron.unschedule('daily-rfp-summary');

-- Programmer l'envoi quotidien des emails récapitulatifs à 9h00 (heure française)
-- Cron expression: '0 7 * * *' = tous les jours à 7h00 UTC (9h00 heure française en hiver, 8h00 en été)
-- Pour tenir compte de l'heure d'été, on utilise 7h00 UTC qui correspond à 9h00 heure française en hiver
SELECT cron.schedule(
  'daily-rfp-summary',
  '0 7 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://onuznsfzlkguvfdeilff.supabase.co/functions/v1/send-daily-rfp-summary',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Vérifier que la tâche a été créée
SELECT 
  jobname, 
  schedule, 
  command,
  active
FROM cron.job 
WHERE jobname = 'daily-rfp-summary';