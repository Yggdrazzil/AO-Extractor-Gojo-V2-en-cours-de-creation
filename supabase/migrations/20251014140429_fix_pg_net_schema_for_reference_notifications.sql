/*
  # Fix pg_net schema reference in notify_new_reference trigger

  1. Changes
    - Update notify_new_reference function to use correct pg_net schema (extensions.http_post)
    - The trigger was using net.http_post but pg_net is installed in extensions schema
  
  2. Notes
    - This fixes the "schema 'net' does not exist" error
    - The function continues to send email notifications when new references are created
*/

-- Drop and recreate the function with correct schema reference
CREATE OR REPLACE FUNCTION notify_new_reference()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  sales_rep_record RECORD;
  function_url TEXT;
  supabase_url TEXT;
  service_role_key TEXT;
  request_id bigint;
BEGIN
  -- Get sales rep info
  SELECT code INTO sales_rep_record
  FROM sales_reps
  WHERE id = NEW.sales_rep_id;

  -- Skip if no sales rep assigned
  IF sales_rep_record.code IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get Supabase URL from environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://zqyrcimkgktbfjhupwsv.supabase.co';
  END IF;

  -- Construct function URL
  function_url := supabase_url || '/functions/v1/send-reference-notification';

  -- Get service role key
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Make async HTTP request to edge function using correct schema
  SELECT extensions.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object(
      'referenceId', NEW.id,
      'client', NEW.client,
      'operational_contact', NEW.operational_contact,
      'phone', NEW.phone,
      'email', NEW.email,
      'tech_name', NEW.tech_name,
      'salesRepCode', sales_rep_record.code,
      'assignedTo', NEW.sales_rep_id,
      'hasPDF', (NEW.pdf_url IS NOT NULL),
      'pdfName', NEW.pdf_name
    )
  ) INTO request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
    RETURN NEW;
END;
$$;
