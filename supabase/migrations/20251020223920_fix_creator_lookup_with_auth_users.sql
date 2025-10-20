/*
  # Fix Creator Lookup with Auth Users Fallback

  1. Problem
    - When created_by user is not in sales_reps table, trigram shows "N/A"
    - User exists in auth.users but function only checks sales_reps
  
  2. Solution
    - First try to get trigram/name from sales_reps (commercial users)
    - If not found, fallback to auth.users and extract name from email
    - Format: "EPO" from "etienne.poulain@hito-digital.com"
  
  3. Security
    - Maintains existing RLS policies
    - No breaking changes
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
  v_assigned_to_id uuid;
  v_user_email text;
  v_email_parts text[];
BEGIN
  -- Récupérer les infos du créateur depuis sales_reps
  SELECT 
    COALESCE(trigram, code, 'N/A'),
    COALESCE(name, 'Utilisateur inconnu')
  INTO v_creator_trigram, v_creator_name
  FROM sales_reps
  WHERE id = NEW.created_by;
  
  -- Si pas trouvé dans sales_reps, chercher dans auth.users
  IF v_creator_trigram = 'N/A' OR v_creator_trigram IS NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = NEW.created_by;
    
    IF v_user_email IS NOT NULL THEN
      -- Extraire le nom de l'email (partie avant @)
      v_email_parts := string_to_array(split_part(v_user_email, '@', 1), '.');
      
      -- Si format prenom.nom, créer trigramme et nom complet
      IF array_length(v_email_parts, 1) >= 2 THEN
        -- Trigramme: première lettre du prénom + 2 premières lettres du nom
        v_creator_trigram := upper(
          substring(v_email_parts[1], 1, 1) || 
          substring(v_email_parts[2], 1, 2)
        );
        
        -- Nom complet: Prénom Nom (capitalisé)
        v_creator_name := initcap(v_email_parts[1]) || ' ' || initcap(v_email_parts[2]);
      ELSE
        -- Si pas de format prénom.nom, utiliser l'email
        v_creator_trigram := upper(substring(v_email_parts[1], 1, 3));
        v_creator_name := initcap(v_email_parts[1]);
      END IF;
    ELSE
      -- Fallback si aucun utilisateur trouvé
      v_creator_trigram := 'N/A';
      v_creator_name := 'Utilisateur inconnu';
    END IF;
  END IF;
  
  -- Construire le message selon le type de table
  IF TG_TABLE_NAME = 'rfps' THEN
    v_notification_type := 'new_rfp';
    v_assigned_to_id := NEW.assigned_to;
    
    IF NEW.assigned_to = NEW.created_by THEN
      v_message := 'Vous avez ajouté un nouvel AO : ' || NEW.client || ' - ' || NEW.mission;
    ELSE
      v_message := v_creator_trigram || ' vous a attribué un nouvel AO : ' || NEW.client || ' - ' || NEW.mission;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'prospects' THEN
    v_notification_type := 'new_prospect';
    v_assigned_to_id := NEW.assigned_to;
    v_client_name := COALESCE(NEW.target_account, 'Client non spécifié');
    
    IF NEW.assigned_to = NEW.created_by THEN
      v_message := 'Vous avez ajouté un nouveau profil pour prise de références chez ' || v_client_name;
    ELSE
      v_message := v_creator_trigram || ' vous a attribué un nouveau profil pour prise de références chez ' || v_client_name;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'client_needs' THEN
    v_notification_type := 'new_client_need';
    v_assigned_to_id := NEW.assigned_to;
    
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
    v_assigned_to_id := NEW.sales_rep_id;
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
    v_assigned_to_id,
    NEW.created_by,
    v_creator_trigram,
    v_creator_name,
    v_message
  );
  
  RETURN NEW;
END;
$function$;