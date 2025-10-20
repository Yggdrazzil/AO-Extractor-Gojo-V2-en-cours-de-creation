/*
  # Fix Reference Marketplace Notification with Hardcoded Values

  1. Problem
    - app.supabase_url and app.supabase_anon_key cannot be set via migrations (permission denied)
    - current_setting() returns null for these parameters
    - This prevents all database triggers from calling Edge Functions
    
  2. Solution
    - Use hardcoded values directly in the trigger function
    - This matches the actual configuration from the .env file
    - Edge Function is already deployed with verify_jwt: false so anon key will work
    
  3. Security
    - These are public values (URL and anon key) that are safe to hardcode
    - The anon key has limited permissions controlled by RLS policies
    - The Edge Function uses service role key internally for sensitive operations
*/

-- Final fix: Use hardcoded values since settings cannot be configured
CREATE OR REPLACE FUNCTION notify_new_reference()
RETURNS TRIGGER AS $$
DECLARE
  sales_rep_record RECORD;
  supabase_url TEXT := 'https://onuznsfzlkguvfdeilff.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udXpuc2Z6bGtndXZmZGVpbGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTQyNzgsImV4cCI6MjA2MzU5MDI3OH0.Nmjfn7DDs36lIqs1pG33p7JaQ3aEmXr6WFqZBQPWqIE';
BEGIN
  -- Get sales rep info
  SELECT code, email INTO sales_rep_record
  FROM sales_reps
  WHERE id = NEW.sales_rep_id;

  -- Skip if no sales rep assigned
  IF sales_rep_record IS NULL THEN
    RAISE WARNING 'Sales rep not found for ID: %', NEW.sales_rep_id;
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