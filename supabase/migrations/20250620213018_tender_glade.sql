/*
  # Remplacer Date Mise à jour par Compte Ciblé

  1. Modifications de la table prospects
    - Supprimer la colonne `date_update`
    - Ajouter la colonne `target_account` (text)

  2. Mise à jour des index
    - Supprimer l'index sur date_update s'il existe
    - Ajouter un index sur target_account pour les performances
*/

-- Supprimer la colonne date_update
ALTER TABLE public.prospects DROP COLUMN IF EXISTS date_update;

-- Ajouter la colonne target_account
ALTER TABLE public.prospects ADD COLUMN IF NOT EXISTS target_account text DEFAULT '';

-- Créer un index pour les performances sur la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_prospects_target_account ON public.prospects(target_account);