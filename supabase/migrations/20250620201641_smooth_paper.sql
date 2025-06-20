/*
  # Add is_read field to RFPs table

  1. Changes
    - Add `is_read` boolean field to rfps table with default false
    - Add index for better performance on is_read queries

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add is_read field to rfps table
ALTER TABLE public.rfps 
ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_rfps_is_read ON public.rfps(is_read);