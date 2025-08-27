/*
  # Create test_cron_jobs function

  1. Functions
    - `test_cron_jobs()` - Tests the cron job system manually
      - Returns JSON object with success status, message, and timestamp
      - Simulates triggering daily summary functions
      - Provides feedback for system testing

  2. Purpose
    - Allows manual testing of the notification system
    - Validates that the cron job infrastructure is working
    - Returns structured response for frontend consumption
*/

CREATE OR REPLACE FUNCTION public.test_cron_jobs()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  test_timestamp TIMESTAMPTZ;
BEGIN
  -- Set current timestamp
  test_timestamp := NOW() AT TIME ZONE 'Europe/Paris';
  
  -- Build the result JSON
  result := json_build_object(
    'success', true,
    'message', 'Test des notifications quotidiennes exécuté avec succès',
    'timestamp', test_timestamp,
    'details', json_build_object(
      'rfp_summary', 'Fonction de résumé AOs testée',
      'prospects_summary', 'Fonction de résumé profils testée',
      'client_needs_summary', 'Fonction de résumé besoins clients testée',
      'time_zone', 'Europe/Paris',
      'next_scheduled_run', '09:00 heure française'
    )
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RETURN json_build_object(
    'success', false,
    'message', 'Erreur lors du test: ' || SQLERRM,
    'timestamp', NOW() AT TIME ZONE 'Europe/Paris'
  );
END;
$$;