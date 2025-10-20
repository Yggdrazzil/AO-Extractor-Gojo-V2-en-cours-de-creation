/*
  # Add Reference to Notification Constraints

  1. Problem
    - The check constraints on new_record_notifications don't include 'new_reference' notification type
    - The check constraints don't include 'reference_marketplace' table name
    - This prevents reference notifications from being created
  
  2. Solution
    - Drop and recreate the constraints to include the new values
    - Add 'new_reference' to valid_notification_type constraint
    - Add 'reference_marketplace' to valid_table_name constraint
  
  3. Security
    - Maintains existing RLS policies
    - No breaking changes to existing data
*/

-- Drop existing constraints
ALTER TABLE new_record_notifications 
  DROP CONSTRAINT IF EXISTS valid_notification_type;

ALTER TABLE new_record_notifications 
  DROP CONSTRAINT IF EXISTS valid_table_name;

-- Recreate constraints with reference_marketplace and new_reference included
ALTER TABLE new_record_notifications 
  ADD CONSTRAINT valid_notification_type 
  CHECK (notification_type = ANY (ARRAY['new_rfp'::text, 'new_prospect'::text, 'new_client_need'::text, 'new_reference'::text]));

ALTER TABLE new_record_notifications 
  ADD CONSTRAINT valid_table_name 
  CHECK (table_name = ANY (ARRAY['prospects'::text, 'rfps'::text, 'client_needs'::text, 'reference_marketplace'::text]));