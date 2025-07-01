/*
  # Configuration du système de mail quotidien récapitulatif pour les prospects

  1. Extension pg_cron
    - Utilise l'extension pg_cron déjà activée pour programmer des tâches
    
  2. Tâche quotidienne prospects
    - Programme l'envoi des emails récapitulatifs à 9h01 (heure française)
    - Utilise la fonction Edge pour envoyer les emails des prospects
    
  3. Sécurité
    - La tâche s'exécute avec les permissions appropriées
*/

-- Supprimer la tâche existante si elle existe déjà
SELECT cron.unschedule('daily-prospects-summary');

-- Programmer l'envoi quotidien des emails récapitulatifs prospects à 9h01 (heure française)
-- Cron expression: '1 7 * * *' = tous les jours à 7h01 UTC (9h01 heure française en hiver, 8h01 en été)
SELECT cron.schedule(
  'daily-prospects-summary',
  '1 7 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://onuznsfzlkguvfdeilff.supabase.co/functions/v1/send-daily-prospects-summary',
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
WHERE jobname = 'daily-prospects-summary';