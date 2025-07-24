/*
  # Ajout de la colonne commentaires aux AOs

  1. Modifications de table
    - Ajouter la colonne `comments` à la table `rfps`
    - Type: text pour stocker les commentaires
    - Valeur par défaut: chaîne vide

  2. Sécurité
    - Pas de changement RLS nécessaire (colonne simple)
    - Index pour améliorer les performances de recherche

  3. Compatibilité
    - Utilise IF NOT EXISTS pour éviter les erreurs
    - Colonne nullable pour compatibilité
*/

-- Ajouter la colonne comments si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rfps' AND column_name = 'comments' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.rfps ADD COLUMN comments text DEFAULT '';
    
    -- Ajouter un index pour la recherche textuelle des commentaires
    CREATE INDEX IF NOT EXISTS idx_rfps_comments 
    ON public.rfps USING gin(to_tsvector('french', comments));
    
    -- Log de confirmation
    RAISE NOTICE 'Column comments added to rfps table successfully';
  ELSE
    RAISE NOTICE 'Column comments already exists in rfps table';
  END IF;
END $$;