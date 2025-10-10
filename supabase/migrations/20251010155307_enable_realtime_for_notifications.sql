/*
  # Activer Realtime pour les notifications

  1. Problème
    - La table new_record_notifications n'est pas dans la publication Realtime
    - Les événements INSERT/UPDATE ne sont pas diffusés en temps réel
    
  2. Solution
    - Ajouter la table à la publication supabase_realtime
    - Activer REPLICA IDENTITY FULL pour capturer les anciennes valeurs dans les UPDATE
*/

-- Activer REPLICA IDENTITY FULL pour capturer l'ancien état lors des UPDATE
ALTER TABLE new_record_notifications REPLICA IDENTITY FULL;

-- Ajouter la table à la publication Realtime de Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE new_record_notifications;