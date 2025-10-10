/*
  # Corriger le trigger de notifications pour remplir automatiquement created_by

  1. Modifications
    - Ajouter un trigger BEFORE INSERT qui remplit automatiquement created_by avec l'ID du sales_rep connecté
    - Mettre à jour le trigger de notifications pour utiliser NEW.created_by
    
  2. Notes
    - created_by sera automatiquement rempli lors de l'insertion
    - Le système de notifications fonctionnera correctement
*/

-- Fonction pour remplir automatiquement created_by lors de l'insertion
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
DECLARE
  v_sales_rep_id uuid;
BEGIN
  -- Récupérer l'ID du sales_rep correspondant à l'utilisateur connecté
  SELECT id INTO v_sales_rep_id
  FROM sales_reps
  WHERE id = auth.uid();
  
  -- Si trouvé, l'assigner, sinon utiliser assigned_to par défaut
  IF v_sales_rep_id IS NOT NULL THEN
    NEW.created_by := v_sales_rep_id;
  ELSIF NEW.created_by IS NULL THEN
    NEW.created_by := NEW.assigned_to;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer le trigger sur rfps
DROP TRIGGER IF EXISTS set_created_by_rfps ON rfps;
CREATE TRIGGER set_created_by_rfps
  BEFORE INSERT ON rfps
  FOR EACH ROW
  WHEN (NEW.created_by IS NULL)
  EXECUTE FUNCTION set_created_by();

-- Appliquer le trigger sur prospects
DROP TRIGGER IF EXISTS set_created_by_prospects ON prospects;
CREATE TRIGGER set_created_by_prospects
  BEFORE INSERT ON prospects
  FOR EACH ROW
  WHEN (NEW.created_by IS NULL)
  EXECUTE FUNCTION set_created_by();

-- Appliquer le trigger sur client_needs
DROP TRIGGER IF EXISTS set_created_by_client_needs ON client_needs;
CREATE TRIGGER set_created_by_client_needs
  BEFORE INSERT ON client_needs
  FOR EACH ROW
  WHEN (NEW.created_by IS NULL)
  EXECUTE FUNCTION set_created_by();