import { supabase, safeSupabaseOperation } from './supabaseClient';
import type { BoondmanagerProspect } from '../../types';
import { sendClientNeedNotification, getSalesRepCode } from '../clientNeedNotification';

/**
 * Récupère tous les profils pour besoins clients
 * @returns Liste des profils pour besoins clients
 */
export async function fetchClientNeeds(): Promise<BoondmanagerProspect[]> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Erreur de session');
    }
    
    if (!session) {
      console.error('No active session found');
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('client_needs')
      .select('id, text_content, file_name, file_url, file_content, selected_need_id, selected_need_title, availability, daily_rate, salary_expectations, residence, mobility, phone, email, status, assigned_to, is_read, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client needs:', error);
      
      if (error.code === 'PGRST301') {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      } else if (error.code === '42501') {
        throw new Error('Permissions insuffisantes pour accéder aux données.');
      } else {
        throw new Error(error.message || 'Erreur lors du chargement des données');
      }
    }
  
    if (!data) {
      console.warn('No data returned from Supabase');
      return [];
    }
  
    console.log('Successfully fetched client needs:', { count: data.length });
    
    return data.map(need => ({
      id: need.id,
      textContent: need.text_content || '',
      fileName: need.file_name,
      fileUrl: need.file_url,
      fileContent: need.file_content,
      selectedNeedId: need.selected_need_id,
      selectedNeedTitle: need.selected_need_title,
      availability: need.availability || '-',
      dailyRate: need.daily_rate,
      salaryExpectations: need.salary_expectations,
      residence: need.residence || '-',
      mobility: need.mobility || '-',
      phone: need.phone || '-',
      email: need.email || '-',
      status: need.status,
      assignedTo: need.assigned_to,
      isRead: need.is_read || false
    }));
  } catch (error) {
    console.error('Failed to fetch client needs:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erreur lors du chargement des données');
    }
  }
}

/**
 * Ajoute un profil pour besoin client
 * @param newProspect - Données du profil à ajouter
 * @returns Profil créé
 */
export async function addClientNeed(newProspect: BoondmanagerProspect): Promise<BoondmanagerProspect> {
  try {
    // Vérifier que le commercial existe
    const { data: salesRep, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('id, code')
      .eq('id', newProspect.assignedTo)
      .single();

    if (salesRepError || !salesRep) {
      console.error('Sales rep not found:', newProspect.assignedTo);
      throw new Error('Commercial non trouvé');
    }

    // Préparer les données pour l'insertion
    const insertData = {
      text_content: newProspect.textContent,
      file_name: newProspect.fileName,
      file_url: newProspect.fileUrl,
      file_content: newProspect.fileContent,
      selected_need_id: newProspect.selectedNeedId,
      selected_need_title: newProspect.selectedNeedTitle,
      availability: newProspect.availability,
      daily_rate: newProspect.dailyRate,
      salary_expectations: newProspect.salaryExpectations,
      residence: newProspect.residence,
      mobility: newProspect.mobility,
      phone: newProspect.phone,
      email: newProspect.email,
      status: newProspect.status,
      assigned_to: newProspect.assignedTo,
      is_read: newProspect.isRead
    };

    console.log('Creating client need with data:', insertData);

    // Insérer le profil
    const { data, error } = await supabase
      .from('client_needs')
      .insert([insertData])
      .select('id, text_content, file_name, file_url, file_content, selected_need_id, selected_need_title, availability, daily_rate, salary_expectations, residence, mobility, phone, email, status, assigned_to, is_read, created_at')
      .single();

    if (error) {
      console.error('Error creating client need:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to create client need');
    }
    
    console.log('Successfully created client need:', data);

    // Envoi de la notification email (non bloquant)
    try {
      const salesRepCode = await getSalesRepCode(newProspect.assignedTo);
      if (salesRepCode) {
        // Programmer l'envoi avec un délai de 30 secondes
        const emailScheduled = await sendClientNeedNotification({
          prospectId: data.id,
          besoin: data.selected_need_title,
          salesRepCode,
          assignedTo: data.assigned_to,
          hasCV: !!data.file_name,
          fileName: data.file_name || undefined
        }, 0.5); // 30 secondes de délai (0.5 minute)
        
        if (emailScheduled) {
          console.log('Client need email notification scheduled successfully (will be sent in 30 seconds)');
        } else {
          console.log('Client need email notification could not be scheduled');
        }
      } else {
        console.warn('Could not send client need email: sales rep code not found');
      }
    } catch (emailError) {
      console.warn('Client need email notification scheduling failed (non-blocking):', emailError);
    }
    
    // Mapper les données pour le retour
    return {
      id: data.id,
      textContent: data.text_content,
      fileName: data.file_name,
      fileUrl: data.file_url,
      fileContent: data.file_content,
      selectedNeedId: data.selected_need_id,
      selectedNeedTitle: data.selected_need_title,
      availability: data.availability || '-',
      dailyRate: data.daily_rate,
      salaryExpectations: data.salary_expectations,
      residence: data.residence || '-',
      mobility: data.mobility || '-',
      phone: data.phone || '-',
      email: data.email || '-',
      status: data.status,
      assignedTo: data.assigned_to,
      isRead: data.is_read
    };
  } catch (error) {
    console.error('Failed to add client need:', error);
    throw error;
  }
}

/**
 * Met à jour le statut d'un profil
 * @param id - ID du profil
 * @param status - Nouveau statut
 */
export async function updateClientNeedStatus(id: string, status: BoondmanagerProspect['status']): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('client_needs')
      .update({ status })
      .eq('id', id)
  );
}

/**
 * Met à jour le commercial assigné
 * @param id - ID du profil
 * @param assignedTo - ID du commercial
 */
export async function updateClientNeedAssignee(id: string, assignedTo: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('client_needs')
      .update({ assigned_to: assignedTo })
      .eq('id', id)
  );
}

/**
 * Met à jour le besoin sélectionné
 * @param id - ID du profil
 * @param selectedNeedTitle - Titre du besoin
 */
export async function updateClientNeedSelectedNeed(id: string, selectedNeedTitle: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('client_needs')
      .update({ selected_need_title: selectedNeedTitle })
      .eq('id', id)
  );
}

/**
 * Met à jour la disponibilité
 * @param id - ID du profil
 * @param availability - Nouvelle disponibilité
 */
export async function updateClientNeedAvailability(id: string, availability: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('client_needs')
      .update({ availability })
      .eq('id', id)
  );
}

/**
 * Met à jour le TJM
 * @param id - ID du profil
 * @param dailyRate - Nouveau TJM
 */
export async function updateClientNeedDailyRate(id: string, dailyRate: number | null): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('client_needs')
      .update({ daily_rate: dailyRate })
      .eq('id', id)
  );
}

/**
 * Met à jour la résidence
 * @param id - ID du profil
 * @param residence - Nouvelle résidence
 */
export async function updateClientNeedResidence(id: string, residence: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('client_needs')
      .update({ residence })
      .eq('id', id)
  );
}

/**
 * Met à jour la mobilité
 * @param id - ID du profil
 * @param mobility - Nouvelle mobilité
 */
export async function updateClientNeedMobility(id: string, mobility: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('client_needs')
      .update({ mobility })
      .eq('id', id)
  );
}

/**
 * Met à jour le téléphone
 * @param id - ID du profil
 * @param phone - Nouveau téléphone
 */
export async function updateClientNeedPhone(id: string, phone: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('client_needs')
      .update({ phone })
      .eq('id', id)
  );
}

/**
 * Met à jour l'email
 * @param id - ID du profil
 * @param email - Nouvel email
 */
export async function updateClientNeedEmail(id: string, email: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('client_needs')
      .update({ email })
      .eq('id', id)
  );
}

/**
 * Marque un profil comme lu
 * @param id - ID du profil
 */
export async function markClientNeedAsRead(id: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('client_needs')
      .update({ is_read: true })
      .eq('id', id)
  );
}

/**
 * Supprime un profil
 * @param id - ID du profil
 */
export async function deleteClientNeed(id: string): Promise<void> {
  try {
    // Récupérer l'URL du fichier avant suppression
    const { data: clientNeed, error: fetchError } = await supabase
      .from('client_needs')
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching client need for deletion:', fetchError);
    }

    // Supprimer le profil
    await safeSupabaseOperation(() => 
      supabase
        .from('client_needs')
        .delete()
        .eq('id', id)
    );

    // Supprimer le fichier associé si présent
    if (clientNeed?.file_url) {
      try {
        const { deleteFile } = await import('../fileUpload');
        const url = new URL(clientNeed.file_url);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(-2).join('/');
        
        await deleteFile(filePath);
        console.log('File deleted from storage:', filePath);
      } catch (fileError) {
        console.error('Error deleting file from storage:', fileError);
      }
    }
  } catch (error) {
    console.error('Error in deleteClientNeed:', error);
    throw error;
  }
}