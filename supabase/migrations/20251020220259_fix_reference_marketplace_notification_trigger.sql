/*
  # Fix Reference Marketplace Email Notification Trigger

  1. Problem Identified
    - The trigger was using incorrect setting names: 'app.settings.supabase_url' instead of 'app.supabase_url'
    - Missing error handling (EXCEPTION block) which causes silent failures
    - The trigger function needs to match the working pattern from prospects

  2. Solution
    - Update function to use correct setting names
    - Add proper error handling with EXCEPTION block
    - Ensure consistency with working prospect notification trigger

  3. Changes
    - Replace 'app.settings.supabase_url' with 'app.supabase_url'
    - Replace 'app.settings.service_role_key' with 'app.service_role_key'
    - Add EXCEPTION block for error handling
    - Add warning logs for debugging
*/

-- Drop and recreate the function with correct configuration
CREATE OR REPLACE FUNCTION notify_new_reference()
RETURNS TRIGGER AS $$
DECLARE
  sales_rep_record RECORD;
  supabase_url TEXT;
  service_role_key TEXT;
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

  -- Get environment variables with correct setting names
  supabase_url := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);

  -- Verify configuration is available
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RAISE WARNING 'Supabase configuration missing for reference email notification';
    RETURN NEW;
  END IF;

  -- Make async HTTP request to edge function (non-blocking)
  PERFORM
    net.http_post(
      url := supabase_url || '/functions/v1/send-reference-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
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

-- Recreate the trigger (in case it needs to be updated)
DROP TRIGGER IF EXISTS on_reference_created ON reference_marketplace;
CREATE TRIGGER on_reference_created
  AFTER INSERT ON reference_marketplace
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_reference();