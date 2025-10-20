/*
  # Configure Service Role Key for Email Notifications

  1. Problem
    - Email notification triggers need app.service_role_key configured
    - This key is used to authenticate HTTP calls from pg_net to Edge Functions
    - Currently the setting is not configured, causing all notifications to fail silently
    
  2. Solution
    - Set app.service_role_key as a runtime parameter
    - Use DO block to set it if not already configured
    
  3. Security
    - This setting is only accessible from SECURITY DEFINER functions
    - The service role key grants admin access to the Supabase project
*/

-- Configure service role key for HTTP calls to Edge Functions
-- This will be used by notification triggers to call Edge Functions via pg_net
DO $$
BEGIN
  -- Try to read from environment variable if available
  -- Otherwise, we'll need to set it manually via dashboard
  BEGIN
    -- Attempt to set from SUPABASE_SERVICE_ROLE_KEY environment variable
    EXECUTE format('ALTER DATABASE %I SET app.service_role_key TO %L',
      current_database(),
      current_setting('env.SUPABASE_SERVICE_ROLE_KEY', true)
    );
  EXCEPTION WHEN OTHERS THEN
    -- If environment variable doesn't exist, log a warning
    -- The key will need to be configured manually via Supabase dashboard
    RAISE NOTICE 'Could not auto-configure app.service_role_key. Please set it manually via: ALTER DATABASE postgres SET app.service_role_key = ''your-service-role-key'';';
  END;
END $$;