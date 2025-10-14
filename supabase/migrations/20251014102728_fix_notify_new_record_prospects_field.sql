/*
  # Fix notify_new_record function for prospects table

  Correction de la fonction notify_new_record() pour utiliser le bon champ
  dans la table prospects.
  
  ## Problème identifié
  - La fonction essayait d'accéder à NEW.client_name dans la table prospects
  - Ce champ n'existe pas dans prospects (il s'appelle target_account)
  - Cela causait une erreur 400 lors de l'insertion de nouveaux prospects
  
  ## Solution
  - Remplacer NEW.client_name par NEW.target_account pour la table prospects
*/

CREATE OR REPLACE FUNCTION public.notify_new_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_creator_trigram text;
  v_creator_name text;
  v_notification_type text;
  v_message text;
  v_client_name text;
BEGIN
  -- Récupérer les infos du créateur
  SELECT trigram, name INTO v_creator_trigram, v_creator_name
  FROM sales_reps
  WHERE id = NEW.created_by;
  
  -- Si pas de trigramme, utiliser le code ou les initiales du nom
  IF v_creator_trigram IS NULL THEN
    SELECT code INTO v_creator_trigram
    FROM sales_reps
    WHERE id = NEW.created_by;
  END IF;
  
  -- Construire le message selon le type de table
  IF TG_TABLE_NAME = 'rfps' THEN
    v_notification_type := 'new_rfp';
    
    IF NEW.assigned_to = NEW.created_by THEN
      v_message := 'Vous avez ajouté un nouvel AO : ' || NEW.client || ' - ' || NEW.mission;
    ELSE
      v_message := v_creator_trigram || ' vous a attribué un nouvel AO : ' || NEW.client || ' - ' || NEW.mission;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'prospects' THEN
    v_notification_type := 'new_prospect';
    -- FIX: Utiliser target_account au lieu de client_name pour la table prospects
    v_client_name := COALESCE(NEW.target_account, 'Client non spécifié');
    
    IF NEW.assigned_to = NEW.created_by THEN
      v_message := 'Vous avez ajouté un nouveau profil pour prise de références chez ' || v_client_name;
    ELSE
      v_message := v_creator_trigram || ' vous a attribué un nouveau profil pour prise de références chez ' || v_client_name;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'client_needs' THEN
    v_notification_type := 'new_client_need';
    
    IF NEW.assigned_to = NEW.created_by THEN
      v_message := 'Vous avez ajouté un nouveau profil pour besoin client : ' || NEW.selected_need_title;
    ELSE
      v_message := v_creator_trigram || ' vous a attribué un nouveau profil pour besoin client : ' || NEW.selected_need_title;
    END IF;
    
    -- Ajouter le nom du candidat s'il existe
    IF NEW.name IS NOT NULL AND NEW.name != '' AND NEW.name != '-' THEN
      v_message := v_message || ' (' || NEW.name || ')';
    END IF;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Créer la notification pour TOUTES les nouvelles attributions
  INSERT INTO new_record_notifications (
    table_name,
    record_id,
    notification_type,
    assigned_to,
    created_by,
    creator_trigram,
    creator_name,
    message
  ) VALUES (
    TG_TABLE_NAME,
    NEW.id,
    v_notification_type,
    NEW.assigned_to,
    NEW.created_by,
    v_creator_trigram,
    v_creator_name,
    v_message
  );
  
  RETURN NEW;
END;
$function$;
