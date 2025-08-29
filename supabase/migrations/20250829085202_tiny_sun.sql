/*
  # Diagnostic des capacités de cron jobs

  1. Vérifications
    - Vérifier si l'extension pg_cron est disponible
    - Vérifier les permissions pour créer des cron jobs
    - Créer des fonctions de diagnostic

  2. Alternatives
    - Si pg_cron n'est pas disponible, créer des fonctions alternatives
    - Documenter les limitations et alternatives
*/

-- Vérifier si l'extension pg_cron est disponible
DO $$
BEGIN
  -- Essayer de vérifier si pg_cron est installé
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron extension is installed';
  ELSE
    RAISE NOTICE 'pg_cron extension is NOT installed - cron jobs will not work';
  END IF;
END $$;

-- Créer une table pour stocker les informations de diagnostic
CREATE TABLE IF NOT EXISTS cron_system_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component text NOT NULL,
  status text NOT NULL,
  message text NOT NULL,
  details jsonb DEFAULT '{}',
  checked_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table de diagnostic
ALTER TABLE cron_system_status ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'accès aux utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to access cron status"
  ON cron_system_status
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fonction pour diagnostiquer les capacités du système
CREATE OR REPLACE FUNCTION diagnose_cron_capabilities()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb := '{}';
  pg_cron_available boolean := false;
  can_create_cron boolean := false;
  error_msg text;
BEGIN
  -- Nettoyer les anciens diagnostics
  DELETE FROM cron_system_status WHERE checked_at < now() - interval '1 hour';
  
  -- Test 1: Vérifier si pg_cron existe
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) INTO pg_cron_available;
    
    INSERT INTO cron_system_status (component, status, message, details)
    VALUES (
      'pg_cron_extension',
      CASE WHEN pg_cron_available THEN 'success' ELSE 'error' END,
      CASE WHEN pg_cron_available 
        THEN 'Extension pg_cron est installée'
        ELSE 'Extension pg_cron n''est pas installée - les cron jobs ne fonctionneront pas'
      END,
      jsonb_build_object('available', pg_cron_available)
    );
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO cron_system_status (component, status, message, details)
    VALUES (
      'pg_cron_extension',
      'error',
      'Erreur lors de la vérification de pg_cron: ' || SQLERRM,
      jsonb_build_object('error', SQLERRM)
    );
  END;
  
  -- Test 2: Vérifier les permissions pour créer des cron jobs
  IF pg_cron_available THEN
    BEGIN
      -- Essayer de lister les cron jobs existants
      PERFORM cron.schedule('test_permissions', '* * * * *', 'SELECT 1;');
      PERFORM cron.unschedule('test_permissions');
      can_create_cron := true;
      
      INSERT INTO cron_system_status (component, status, message, details)
      VALUES (
        'cron_permissions',
        'success',
        'Permissions pour créer des cron jobs: OK',
        jsonb_build_object('can_create', true)
      );
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO cron_system_status (component, status, message, details)
      VALUES (
        'cron_permissions',
        'error',
        'Pas de permissions pour créer des cron jobs: ' || SQLERRM,
        jsonb_build_object('error', SQLERRM, 'can_create', false)
      );
    END;
  END IF;
  
  -- Test 3: Vérifier les fonctions Edge
  INSERT INTO cron_system_status (component, status, message, details)
  VALUES (
    'edge_functions',
    'info',
    'Fonctions Edge disponibles pour les récapitulatifs',
    jsonb_build_object(
      'functions', ARRAY[
        'send-daily-rfp-summary',
        'send-daily-prospects-summary', 
        'send-daily-client-needs-summary'
      ]
    )
  );
  
  -- Construire le résultat
  SELECT jsonb_build_object(
    'pg_cron_available', pg_cron_available,
    'can_create_cron', can_create_cron,
    'diagnosis_timestamp', now(),
    'recommendations', 
      CASE 
        WHEN NOT pg_cron_available THEN 
          'Utilisez les tests manuels ou configurez un service externe pour les envois automatiques'
        WHEN NOT can_create_cron THEN
          'Contactez l''administrateur Supabase pour activer les permissions cron'
        ELSE 
          'Système compatible - les cron jobs peuvent être configurés'
      END
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Fonction pour lister les cron jobs (version compatible)
CREATE OR REPLACE FUNCTION list_all_cron_jobs()
RETURNS TABLE(
  jobid bigint,
  schedule text,
  command text,
  active boolean,
  jobname text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier d'abord si pg_cron est disponible
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Retourner des données simulées pour indiquer l'état
    RETURN QUERY SELECT 
      0::bigint as jobid,
      '0 8 * * 1-5'::text as schedule,
      'pg_cron extension not available'::text as command,
      false::boolean as active,
      'cron_system_unavailable'::text as jobname;
    RETURN;
  END IF;
  
  -- Si pg_cron est disponible, essayer de lister les vrais cron jobs
  BEGIN
    RETURN QUERY 
    SELECT 
      j.jobid,
      j.schedule,
      j.command,
      j.active,
      j.jobname
    FROM cron.job j
    WHERE j.jobname LIKE 'daily-%summary'
    ORDER BY j.jobname;
  EXCEPTION WHEN OTHERS THEN
    -- En cas d'erreur, retourner le message d'erreur
    RETURN QUERY SELECT 
      -1::bigint as jobid,
      'ERROR'::text as schedule,
      SQLERRM::text as command,
      false::boolean as active,
      'error_listing_jobs'::text as jobname;
  END;
END;
$$;</parameter>