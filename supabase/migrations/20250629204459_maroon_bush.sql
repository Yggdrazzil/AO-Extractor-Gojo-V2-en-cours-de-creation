/*
  # Mise à jour du système d'email avec délai

  1. Modifications
    - Suppression du trigger automatique immédiat
    - Le système d'email sera maintenant géré côté client avec un délai de 2 minutes
    - Cela permet de corriger manuellement le nom du client avant l'envoi

  2. Sécurité
    - Maintien des politiques RLS existantes
    - Pas de changement dans les permissions
*/

-- Supprimer le trigger automatique immédiat
DROP TRIGGER IF EXISTS rfp_email_notification_trigger ON rfps;
DROP FUNCTION IF EXISTS send_rfp_email_notification();

-- Note: L'envoi d'email sera maintenant géré côté client avec un délai de 2 minutes
-- Cela permet à l'utilisateur de corriger manuellement le nom du client si nécessaire
-- avant que l'email ne soit envoyé