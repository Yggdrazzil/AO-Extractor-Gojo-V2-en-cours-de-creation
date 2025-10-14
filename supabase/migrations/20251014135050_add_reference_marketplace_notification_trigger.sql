/*
  # Add email notification trigger for reference marketplace

  1. Changes
    - Add trigger to send email notifications when new reference is created
    - Trigger calls send-reference-notification edge function
    - Only sends notification for newly created references (not updates)
  
  2. Security
    - Uses secure function calling via pg_net extension
    - Only triggers on INSERT operations
*/

CREATE OR REPLACE FUNCTION notify_new_reference()
RETURNS TRIGGER AS $$
DECLARE
  sales_rep_record RECORD;
  function_url TEXT;
  supabase_url TEXT;
  service_role_key TEXT;
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

  -- Make async HTTP request to edge function
  PERFORM net.http_post(
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
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_reference_created ON reference_marketplace;

-- Create trigger that fires only on INSERT
CREATE TRIGGER on_reference_created
  AFTER INSERT ON reference_marketplace
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_reference();
