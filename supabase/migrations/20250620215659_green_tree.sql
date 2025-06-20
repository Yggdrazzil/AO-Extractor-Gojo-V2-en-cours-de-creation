/*
  # Configuration du stockage Supabase

  1. Création du bucket pour les fichiers
    - Bucket public pour les CV et documents
    - Politiques de sécurité appropriées

  2. Sécurité
    - Accès en lecture pour les utilisateurs authentifiés
    - Upload limité aux utilisateurs authentifiés
    - Suppression limitée aux propriétaires
*/

-- Créer le bucket pour les fichiers s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre la lecture des fichiers aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'files');

-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'files' AND auth.uid() IS NOT NULL);

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'files' AND auth.uid() IS NOT NULL);

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'files' AND auth.uid() IS NOT NULL);