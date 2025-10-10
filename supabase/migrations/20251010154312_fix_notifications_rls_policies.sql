/*
  # Corriger les policies RLS pour new_record_notifications

  1. Problème
    - Les policies utilisent `auth.uid()` pour filtrer
    - Mais `assigned_to` contient l'ID de sales_reps, pas celui de auth.users
    - Il faut faire le lien via l'email
    
  2. Solution
    - Supprimer les anciennes policies
    - Créer de nouvelles policies qui utilisent l'email pour faire le lien
    - Les utilisateurs peuvent voir et modifier leurs propres notifications
*/

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON new_record_notifications;
DROP POLICY IF EXISTS "Users can mark their own notifications as read" ON new_record_notifications;

-- Créer la nouvelle policy pour SELECT
CREATE POLICY "Users can view their assigned notifications"
  ON new_record_notifications
  FOR SELECT
  TO authenticated
  USING (
    assigned_to IN (
      SELECT id FROM sales_reps 
      WHERE email = auth.jwt()->>'email'
    )
  );

-- Créer la nouvelle policy pour UPDATE
CREATE POLICY "Users can update their assigned notifications"
  ON new_record_notifications
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to IN (
      SELECT id FROM sales_reps 
      WHERE email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    assigned_to IN (
      SELECT id FROM sales_reps 
      WHERE email = auth.jwt()->>'email'
    )
  );