/*
  # Enable pg_net extension for HTTP notifications

  1. Changes
    - Install pg_net extension to enable HTTP calls from database triggers
    - This is required for email notifications when new references are created
  
  2. Notes
    - pg_net allows async HTTP requests from database triggers
    - Used by the notify_new_reference trigger to send emails via edge functions
*/

-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA net TO authenticated;
