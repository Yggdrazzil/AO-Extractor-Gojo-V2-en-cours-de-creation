/*
  # Création de la fonction proxy Boondmanager

  1. Fonction Edge
    - Proxy pour contourner les CORS de l'API Boondmanager
    - Gestion de l'authentification X-Jwt-Client-BoondManager
    - Support des endpoints opportunities, needs, projects

  2. Sécurité
    - Validation des tokens requis
    - Gestion des erreurs API
    - Headers CORS appropriés
*/

-- Cette migration crée la structure nécessaire pour la fonction Edge
-- La fonction elle-même est déployée via les fichiers dans supabase/functions/

-- Aucune migration SQL nécessaire pour les Edge Functions
-- Elles sont déployées automatiquement depuis le dossier supabase/functions/