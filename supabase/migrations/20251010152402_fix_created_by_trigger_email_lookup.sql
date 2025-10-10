/*
  # Corriger le trigger created_by pour utiliser l'email au lieu de l'ID

  1. Modifications
    - Modifier la fonction set_created_by() pour rechercher le sales_rep par email
    - Au lieu de chercher par id = auth.uid(), chercher par email = auth.jwt()->>'email'
    
  2. Explication
    - L'ID dans auth.users est différent de l'ID dans sales_reps
    - Il faut donc faire le lien par email
*/

-- Fonction corrigée pour remplir automatiquement created_by lors de l'insertion
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
DECLARE
  v_sales_rep_id uuid;
  v_user_email text;
BEGIN
  -- Récupérer l'email de l'utilisateur connecté
  v_user_email := auth.jwt()->>'email';
  
  IF v_user_email IS NOT NULL THEN
    -- Récupérer l'ID du sales_rep correspondant à cet email
    SELECT id INTO v_sales_rep_id
    FROM sales_reps
    WHERE email = v_user_email;
    
    -- Si trouvé, l'assigner
    IF v_sales_rep_id IS NOT NULL THEN
      NEW.created_by := v_sales_rep_id;
      RETURN NEW;
    END IF;
  END IF;
  
  -- Si pas trouvé, utiliser assigned_to par défaut
  IF NEW.created_by IS NULL THEN
    NEW.created_by := NEW.assigned_to;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;