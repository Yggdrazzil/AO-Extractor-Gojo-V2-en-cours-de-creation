/*
  # Fix created_by trigger for prospects

  Mise à jour de la fonction set_created_by pour garantir que created_by
  est toujours rempli correctement :
  
  1. Si l'utilisateur connecté est dans sales_reps (trouvé par email) → utilise son ID
  2. Sinon → utilise assigned_to comme valeur de created_by
  
  Cette correction garantit que le champ created_by (NOT NULL) sera toujours rempli,
  même si l'utilisateur connecté n'est pas un commercial.
*/

-- Recréer la fonction set_created_by avec une logique améliorée
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
  
  -- Si l'utilisateur n'est pas trouvé dans sales_reps,
  -- utiliser assigned_to comme created_by
  IF NEW.created_by IS NULL AND NEW.assigned_to IS NOT NULL THEN
    NEW.created_by := NEW.assigned_to;
  END IF;
  
  RETURN NEW;
END;
$function$;
