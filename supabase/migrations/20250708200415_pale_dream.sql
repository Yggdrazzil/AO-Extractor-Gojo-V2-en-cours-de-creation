/*
  # Correction des permissions RLS pour tous les utilisateurs

  1. Modifications
    - Ajout de politiques RLS plus permissives pour toutes les tables
    - Ajout de policy enable row security pour les tables sans RLS activé
    - Correction des politiques existantes pour simplifier les règles d'accès
  
  2. Tables concernées
    - sales_reps
    - rfps
    - prospects
    - client_needs
    - needs
    - linkedin_links
  
  3. Objectif
    - S'assurer que tout utilisateur authentifié puisse lire les données
    - Permettre la modification des données par tout utilisateur authentifié
*/

-- Active RLS sur toutes les tables si ce n'est pas déjà fait
ALTER TABLE IF EXISTS public.sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rfps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.linkedin_links ENABLE ROW LEVEL SECURITY;

-- Policies pour sales_reps
-- Supprimer les politiques restrictives existantes pour sales_reps s'il y en a
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.sales_reps;

-- Créer des politiques permissives pour sales_reps
CREATE POLICY "Allow full access to authenticated users for sales_reps" 
ON public.sales_reps
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policies pour rfps
-- Supprimer les politiques restrictives existantes pour rfps s'il y en a
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rfps;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.rfps;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.rfps;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.rfps;

-- Créer des politiques permissives pour rfps
CREATE POLICY "Allow full access to authenticated users for rfps" 
ON public.rfps
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policies pour prospects
-- Supprimer les politiques restrictives existantes pour prospects s'il y en a
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.prospects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.prospects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.prospects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.prospects;

-- Créer des politiques permissives pour prospects
CREATE POLICY "Allow full access to authenticated users for prospects" 
ON public.prospects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policies pour client_needs
-- Supprimer les politiques restrictives existantes pour client_needs s'il y en a
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.client_needs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.client_needs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.client_needs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.client_needs;

-- Créer des politiques permissives pour client_needs
CREATE POLICY "Allow full access to authenticated users for client_needs" 
ON public.client_needs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policies pour needs
-- Supprimer les politiques restrictives existantes pour needs s'il y en a
DROP POLICY IF EXISTS "Allow authenticated users to delete needs" ON public.needs;
DROP POLICY IF EXISTS "Allow authenticated users to insert needs" ON public.needs;
DROP POLICY IF EXISTS "Allow authenticated users to update needs" ON public.needs;
DROP POLICY IF EXISTS "Allow authenticated users to view needs" ON public.needs;

-- Créer des politiques permissives pour needs
CREATE POLICY "Allow full access to authenticated users for needs" 
ON public.needs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Policies pour linkedin_links
-- Supprimer les politiques restrictives existantes pour linkedin_links s'il y en a
DROP POLICY IF EXISTS "Allow authenticated users to delete linkedin_links" ON public.linkedin_links;
DROP POLICY IF EXISTS "Allow authenticated users to insert linkedin_links" ON public.linkedin_links;
DROP POLICY IF EXISTS "Allow authenticated users to update linkedin_links" ON public.linkedin_links;
DROP POLICY IF EXISTS "Allow authenticated users to view linkedin_links" ON public.linkedin_links;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.linkedin_links;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.linkedin_links;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.linkedin_links;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.linkedin_links;

-- Créer des politiques permissives pour linkedin_links
CREATE POLICY "Allow full access to authenticated users for linkedin_links" 
ON public.linkedin_links
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);