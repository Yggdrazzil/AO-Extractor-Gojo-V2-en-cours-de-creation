/*
  # Add insert policy for RFPs table
  
  1. Changes
    - Add policy to allow authenticated users to insert into rfps table
*/

CREATE POLICY "Allow insert for authenticated users"
  ON rfps
  FOR INSERT
  TO authenticated
  WITH CHECK (true);