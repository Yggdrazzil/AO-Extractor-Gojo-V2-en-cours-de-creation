/*
  # Réparation des permissions RLS

  Ce script corrige les problèmes de Row Level Security (RLS) en:
  1. S'assurant que RLS est activé sur toutes les tables
  2. Supprimant les politiques restrictives existantes
  3. Créant des politiques permissives pour toutes les tables
  4. Permettant à tous les utilisateurs authentifiés d'accéder à toutes les données
*/

-- Active RLS sur toutes les tables si ce n'est pas déjà fait
ALTER TABLE IF EXISTS public.sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rfps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.linkedin_links ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes pour sales_reps
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.sales_reps;
DROP POLICY IF EXISTS "Allow full access to authenticated users for sales_reps" ON public.sales_reps;

-- Créer une politique permissive pour sales_reps
CREATE POLICY "Allow full access to authenticated users for sales_reps" 
ON public.sales_reps
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Supprimer toutes les politiques existantes pour rfps
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rfps;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.rfps;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.rfps;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.rfps;
DROP POLICY IF EXISTS "Allow full access to authenticated users for rfps" ON public.rfps;

-- Créer une politique permissive pour rfps
CREATE POLICY "Allow full access to authenticated users for rfps" 
ON public.rfps
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Supprimer toutes les politiques existantes pour prospects
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.prospects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.prospects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.prospects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.prospects;
DROP POLICY IF EXISTS "Allow full access to authenticated users for prospects" ON public.prospects;

-- Créer une politique permissive pour prospects
CREATE POLICY "Allow full access to authenticated users for prospects" 
ON public.prospects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Supprimer toutes les politiques existantes pour client_needs
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.client_needs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.client_needs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.client_needs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.client_needs;
DROP POLICY IF EXISTS "Allow full access to authenticated users for client_needs" ON public.client_needs;

-- Créer une politique permissive pour client_needs
CREATE POLICY "Allow full access to authenticated users for client_needs" 
ON public.client_needs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Supprimer toutes les politiques existantes pour needs
DROP POLICY IF EXISTS "Allow authenticated users to delete needs" ON public.needs;
DROP POLICY IF EXISTS "Allow authenticated users to insert needs" ON public.needs;
DROP POLICY IF EXISTS "Allow authenticated users to update needs" ON public.needs;
DROP POLICY IF EXISTS "Allow authenticated users to view needs" ON public.needs;
DROP POLICY IF EXISTS "Allow full access to authenticated users for needs" ON public.needs;

-- Créer une politique permissive pour needs
CREATE POLICY "Allow full access to authenticated users for needs" 
ON public.needs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Supprimer toutes les politiques existantes pour linkedin_links
DROP POLICY IF EXISTS "Allow authenticated users to delete linkedin_links" ON public.linkedin_links;
DROP POLICY IF EXISTS "Allow authenticated users to insert linkedin_links" ON public.linkedin_links;
DROP POLICY IF EXISTS "Allow authenticated users to update linkedin_links" ON public.linkedin_links;
DROP POLICY IF EXISTS "Allow authenticated users to view linkedin_links" ON public.linkedin_links;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.linkedin_links;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.linkedin_links;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.linkedin_links;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.linkedin_links;
DROP POLICY IF EXISTS "Allow full access to authenticated users for linkedin_links" ON public.linkedin_links;

-- Créer une politique permissive pour linkedin_links
CREATE POLICY "Allow full access to authenticated users for linkedin_links" 
ON public.linkedin_links
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);