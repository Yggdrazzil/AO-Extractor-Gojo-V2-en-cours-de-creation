/*
  # Add get_cron_job_status function

  1. New Functions
    - `get_cron_job_status(job_name)` - Returns cron job status information
      - Checks if a cron job exists and its configuration
      - Returns job details including schedule and active status

  2. Purpose
    - Enables the application to check cron job status for daily summaries
    - Provides information about scheduled tasks for RFPs, prospects, and client needs
*/

-- Create function to get cron job status
CREATE OR REPLACE FUNCTION public.get_cron_job_status(job_name text)
RETURNS TABLE (
  jobname text,
  schedule text,
  active boolean,
  next_run timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if pg_cron extension is available
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Return default values if pg_cron is not available
    RETURN QUERY SELECT 
      job_name::text as jobname,
      '0 7 * * *'::text as schedule,
      false::boolean as active,
      null::timestamptz as next_run;
    RETURN;
  END IF;

  -- Try to get cron job information from pg_cron.job table
  BEGIN
    RETURN QUERY 
    SELECT 
      j.jobname::text,
      j.schedule::text,
      j.active::boolean,
      -- Calculate next run time (simplified - actual calculation would be more complex)
      (now() + interval '1 day')::timestamptz as next_run
    FROM cron.job j
    WHERE j.jobname = job_name;
    
    -- If no job found, return default inactive status
    IF NOT FOUND THEN
      RETURN QUERY SELECT 
        job_name::text as jobname,
        '0 7 * * *'::text as schedule,
        false::boolean as active,
        null::timestamptz as next_run;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- If there's any error accessing cron tables, return default values
    RETURN QUERY SELECT 
      job_name::text as jobname,
      '0 7 * * *'::text as schedule,
      false::boolean as active,
      null::timestamptz as next_run;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_cron_job_status(text) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_cron_job_status(text) IS 'Returns status information for a cron job by name';