-- Ajout du job cron pour l'envoi quotidien des récapitulatifs de profils pour besoins clients
-- Ce job s'exécutera tous les jours à 9h02 heure française (7h02 UTC)

-- Vérifier si la fonction cron existe déjà
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'schedule_cron_job') THEN
    -- La fonction n'existe pas, on ne fait rien
    RAISE NOTICE 'La fonction schedule_cron_job n''existe pas encore, elle sera créée lors d''une migration ultérieure';
  ELSE
    -- La fonction existe, on peut l'utiliser pour planifier notre job
    PERFORM schedule_cron_job(
      'daily-client-needs-summary',
      '2 7 * * *',
      'supabase_functions',
      'http://host.docker.internal:54321/functions/v1/send-daily-client-needs-summary',
      'POST',
      '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"}'::jsonb,
      '{}'::jsonb,
      'Envoi quotidien du récapitulatif des profils pour besoins clients à 9h02'
    );
    RAISE NOTICE 'Job cron pour le récapitulatif quotidien des profils pour besoins clients planifié avec succès';
  END IF;
END $$;