/*
  # Fix Reference Marketplace Notification Trigger to Use Anon Key

  1. Problem
    - The Edge Function send-reference-notification is now deployed with verify_jwt: false
    - The trigger should use anon_key instead of service_role_key
    - This matches the pattern used by other working notification triggers like RFPs
    
  2. Solution
    - Update the trigger to use app.supabase_anon_key instead of app.service_role_key
    - This will allow the trigger to successfully call the Edge Function
    
  3. Security
    - The Edge Function itself uses service role internally for database queries
    - The anon key is only used for authenticating the HTTP call from the trigger
*/

-- Update the notification function to use anon key
CREATE OR REPLACE FUNCTION notify_new_reference()
RETURNS TRIGGER AS $$
DECLARE
  sales_rep_record RECORD;
  supabase_url TEXT;
  anon_key TEXT;
BEGIN
  -- Get sales rep info
  SELECT code, email INTO sales_rep_record
  FROM sales_reps
  WHERE id = NEW.sales_rep_id;

  -- Verify sales rep exists
  IF sales_rep_record IS NULL THEN
    RAISE WARNING 'Sales rep not found for ID: %', NEW.sales_rep_id;
    RETURN NEW;
  END IF;

  -- Get environment variables
  supabase_url := current_setting('app.supabase_url', true);
  anon_key := current_setting('app.supabase_anon_key', true);

  -- Verify configuration is available
  IF supabase_url IS NULL OR anon_key IS NULL THEN
    RAISE WARNING 'Supabase configuration missing for reference email notification';
    RETURN NEW;
  END IF;

  -- Make async HTTP request to edge function (non-blocking)
  PERFORM
    net.http_post(
      url := supabase_url || '/functions/v1/send-reference-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
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
        'hasPDF', CASE WHEN NEW.pdf_url IS NOT NULL THEN true ELSE false END,
        'pdfName', NEW.pdf_name
      )
    );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- In case of error, log but don't interrupt the insert
    RAISE WARNING 'Failed to send reference email notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_reference_created ON reference_marketplace;
CREATE TRIGGER on_reference_created
  AFTER INSERT ON reference_marketplace
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_reference();