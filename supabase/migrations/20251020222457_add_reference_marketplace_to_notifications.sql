/*
  # Add Reference Marketplace to Notification System

  1. Changes
    - Update notify_new_record() function to handle reference_marketplace table
    - Add trigger on reference_marketplace table to create in-app notifications
    - Use Store/Hub icon for reference notifications
  
  2. Notification Message
    - When user creates for themselves: "Vous avez ajouté une nouvelle référence chez [Client]"
    - When assigned to someone else: "[Trigram] vous a attribué une nouvelle référence chez [Client]"
  
  3. Security
    - Uses existing RLS policies on new_record_notifications table
    - Only creates notifications for authenticated users
*/

-- Update the notify_new_record function to handle reference_marketplace
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
    
  ELSIF TG_TABLE_NAME = 'reference_marketplace' THEN
    v_notification_type := 'new_reference';
    v_client_name := COALESCE(NEW.client, 'Client non spécifié');
    
    IF NEW.sales_rep_id = NEW.created_by THEN
      v_message := 'Vous avez ajouté une nouvelle référence chez ' || v_client_name;
    ELSE
      v_message := v_creator_trigram || ' vous a attribué une nouvelle référence chez ' || v_client_name;
    END IF;
    
  ELSE
    RETURN NEW;
  END IF;
  
  -- Créer la notification pour TOUTES les nouvelles attributions
  -- Pour reference_marketplace, utiliser sales_rep_id au lieu de assigned_to
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
    CASE 
      WHEN TG_TABLE_NAME = 'reference_marketplace' THEN NEW.sales_rep_id
      ELSE NEW.assigned_to
    END,
    NEW.created_by,
    v_creator_trigram,
    v_creator_name,
    v_message
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for reference_marketplace table
DROP TRIGGER IF EXISTS reference_marketplace_new_record_notification ON reference_marketplace;
CREATE TRIGGER reference_marketplace_new_record_notification
  AFTER INSERT ON reference_marketplace
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_record();