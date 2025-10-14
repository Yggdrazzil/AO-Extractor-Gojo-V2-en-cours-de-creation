/*
  # Make reference marketplace fields nullable

  1. Changes
    - Make phone, email, and tech_name columns nullable in reference_marketplace table
    - These fields are optional in the form, so they should be optional in the database
  
  2. Notes
    - Only client, operational_contact, and sales_rep_id remain required
*/

-- Make phone, email, and tech_name nullable
ALTER TABLE reference_marketplace 
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN tech_name DROP NOT NULL;
