/*
  # Mise à jour du stockage des CV

  1. Modifications de la table prospects
    - Mise à jour de la colonne file_url pour stocker les URLs Supabase Storage
    - Ajout d'un champ file_content pour stocker le contenu extrait du CV

  2. Sécurité
    - Maintien des politiques RLS existantes
    - Ajout d'index pour les performances
*/

-- Ajouter une colonne pour stocker le contenu extrait du CV
ALTER TABLE public.prospects 
ADD COLUMN IF NOT EXISTS file_content text;

-- Créer un index pour les recherches dans le contenu des fichiers
CREATE INDEX IF NOT EXISTS idx_prospects_file_content ON public.prospects USING gin(to_tsvector('french', file_content));

-- Commentaire pour documenter la nouvelle colonne
COMMENT ON COLUMN public.prospects.file_content IS 'Contenu textuel extrait du CV pour analyse par IA';