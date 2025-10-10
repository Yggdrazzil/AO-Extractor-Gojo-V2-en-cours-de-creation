/*
  # Supprimer l'ancien trigger d'attribution obsolète

  1. Modifications
    - Supprimer le trigger client_needs_assignment_notification
    - Supprimer le trigger prospects_assignment_notification (s'il existe)
    - Supprimer le trigger rfps_assignment_notification (s'il existe)
    - Supprimer la fonction create_assignment_notification()
    
  2. Raison
    - Ces triggers essaient d'insérer dans l'ancienne table status_change_notifications qui n'existe plus
    - Ils sont remplacés par le nouveau système avec notify_new_record()
    - Le trigger sur client_needs cause une erreur car il essaie d'accéder à NEW.client qui n'existe pas
*/

-- Supprimer les triggers obsolètes
DROP TRIGGER IF EXISTS client_needs_assignment_notification ON client_needs;
DROP TRIGGER IF EXISTS prospects_assignment_notification ON prospects;
DROP TRIGGER IF EXISTS rfps_assignment_notification ON rfps;

-- Supprimer la fonction obsolète
DROP FUNCTION IF EXISTS create_assignment_notification();