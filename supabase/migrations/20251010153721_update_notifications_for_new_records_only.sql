/*
  # Mettre à jour le système de notifications pour toujours créer des notifications

  1. Modifications
    - Supprimer la condition qui empêche la création de notifications en auto-attribution
    - Créer des notifications pour TOUTES les nouvelles attributions
    - Ajuster le message pour distinguer auto-attribution vs attribution par quelqu'un d'autre
    
  2. Explication
    - Actuellement, si assigned_to = created_by, aucune notification n'est créée
    - L'utilisateur veut voir toutes ses nouvelles tâches dans les notifications
    - Nous allons adapter le message selon le contexte
*/

CREATE OR REPLACE FUNCTION notify_new_record()
RETURNS TRIGGER AS $$
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
    v_client_name := COALESCE(NEW.client_name, 'Client non spécifié');
    
    IF NEW.assigned_to = NEW.created_by THEN
      v_message := 'Vous avez ajouté un nouveau profil pour prise de références chez ' || v_client_name;
    ELSE
      v_message := v_creator_trigram || ' vous a attribué un nouveau profil pour prise de références chez ' || v_client_name;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'client_needs' THEN
    v_notification_type := 'new_client_need';
    
    IF NEW.assigned_to = NEW.created_by THEN
      v_message := 'Vous avez ajouté un nouveau profil pour l''un de vos besoins client : ' || NEW.selected_need_title;
    ELSE
      v_message := v_creator_trigram || ' vous a attribué un nouveau profil pour l''un de vos besoins client : ' || NEW.selected_need_title;
    END IF;
    
    IF NEW.client_name IS NOT NULL AND NEW.client_name != '' THEN
      v_message := v_message || ' - ' || NEW.client_name;
    END IF;
    
    IF NEW.name IS NOT NULL AND NEW.name != '' THEN
      v_message := v_message || ' - ' || NEW.name;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;