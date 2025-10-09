import { supabase } from '../lib/supabase';
import type { BoondmanagerProspect } from '../types';
import { uploadFile } from './fileUpload';
import { sendClientNeedNotification, getSalesRepCode } from './clientNeedNotification';

/**
 * Récupère tous les profils pour besoins clients
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
      .select('id, text_content, file_name, file_url, file_content, selected_need_id, selected_need_title, name, availability, daily_rate, residence, mobility, phone, email, status, assigned_to, is_read, created_at, comments')
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
      name: (need as any).name || '-',
      availability: need.availability || '-',
      dailyRate: need.daily_rate,
      salaryExpectations: need.salary_expectations,
      residence: need.residence || '-',
      mobility: need.mobility || '-',
      phone: need.phone || '-',
      email: need.email || '-',
      status: need.status,
      assignedTo: need.assigned_to,
      isRead: need.is_read || false,
      comments: (need as any).comments || ''
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
 */
export async function addClientNeed(newProspect: BoondmanagerProspect): Promise<BoondmanagerProspect> {
  try {
    const { data: salesRep, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('id, code')
      .eq('id', newProspect.assignedTo)
      .single();

    if (salesRepError || !salesRep) {
      console.error('Sales rep not found:', newProspect.assignedTo);
      throw new Error('Commercial non trouvé');
    }

    let fileUrl = newProspect.fileUrl;
    let fileName = newProspect.fileName;
    let fileContent = newProspect.fileContent;

    const insertData = {
      text_content: newProspect.textContent,
      file_name: fileName,
      file_url: fileUrl,
      file_content: fileContent,
      selected_need_id: newProspect.selectedNeedId,
      selected_need_title: newProspect.selectedNeedTitle,
      name: newProspect.name || '-',
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

    const { data, error} = await supabase
      .from('client_needs')
      .insert([{ ...insertData, comments: '' }])
      .select('id, text_content, file_name, file_url, file_content, selected_need_id, selected_need_title, name, availability, daily_rate, salary_expectations, residence, mobility, phone, email, status, assigned_to, is_read, created_at, comments')
      .single();

    if (error) {
      console.error('Error creating client need:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to create client need');
    }
    
    console.log('Successfully created client need:', data);

    // ✅ Envoi de la notification email (non bloquant)
    try {
      const salesRepCode = await getSalesRepCode(newProspect.assignedTo);
      if (salesRepCode) {
        console.log('🔔 Sending immediate client need email notification for:', salesRepCode);
        // Envoi immédiat après création du besoin client
        const emailScheduled = await sendClientNeedNotification({
          prospectId: data.id,
          besoin: data.selected_need_title,
          salesRepCode,
          assignedTo: data.assigned_to,
          hasCV: !!data.file_name,
          fileName: data.file_name || undefined
        }, 0); // Aucun délai
        
        if (emailScheduled) {
          console.log('✅ Client need email notification sent successfully');
        } else {
          console.log('⚠️ Client need email notification failed');
        }
      } else {
        console.warn('⚠️ Could not send client need email: sales rep code not found');
      }
    } catch (emailError) {
      console.error('❌ Client need email notification failed (non-blocking):', emailError);
    }
    
    return {
      id: data.id,
      textContent: data.text_content,
      fileName: data.file_name,
      fileUrl: data.file_url,
      fileContent: data.file_content,
      selectedNeedId: data.selected_need_id,
      selectedNeedTitle: data.selected_need_title,
      name: (data as any).name || '-',
      availability: data.availability || '-',
      dailyRate: data.daily_rate,
      salaryExpectations: data.salary_expectations,
      residence: data.residence || '-',
      mobility: data.mobility || '-',
      phone: data.phone || '-',
      email: data.email || '-',
      status: data.status,
      assignedTo: data.assigned_to,
      isRead: data.is_read,
      comments: (data as any).comments || ''
    };
  } catch (error) {
    console.error('Failed to add client need:', error);
    throw error;
  }
}

export async function updateClientNeedComments(id: string, comments: string): Promise<void> {
  try {
    console.log('💾 Updating client need comments for ID:', id, 'Content length:', comments.length);
    
    if (!id) {
      console.error('No client need ID provided for comments update');
      return;
    }
    
    const { error } = await supabase
      .from('client_needs')
      .update({ comments })
      .eq('id', id);

    if (error) {
      console.error('Failed to update client need comments:', error);
      throw error;
    }
    
    console.log('✅ Client need comments updated successfully in database');
  } catch (error) {
    console.error('Error in updateClientNeedComments:', error);
    throw error;
  }
}
/**
 * Met à jour le statut d'un profil
 */
export async function updateClientNeedStatus(id: string, status: BoondmanagerProspect['status']): Promise<void> {
  const { error } = await supabase
    .from('client_needs')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Met à jour le commercial assigné
 */
export async function updateClientNeedAssignee(id: string, assignedTo: string): Promise<void> {
  const { error } = await supabase
    .from('client_needs')
    .update({ assigned_to: assignedTo })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Met à jour le besoin sélectionné
 */
export async function updateClientNeedSelectedNeed(id: string, selectedNeedTitle: string): Promise<void> {
  const { error } = await supabase
    .from('client_needs')
    .update({ selected_need_title: selectedNeedTitle })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Met à jour le nom (prénom et nom)
 */
export async function updateClientNeedName(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('client_needs')
    .update({ name })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Met à jour la disponibilité
 */
export async function updateClientNeedAvailability(id: string, availability: string): Promise<void> {
  const { error } = await supabase
    .from('client_needs')
    .update({ availability })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Met à jour le TJM
 */
export async function updateClientNeedDailyRate(id: string, dailyRate: number | null): Promise<void> {
  const { error } = await supabase
    .from('client_needs')
    .update({ daily_rate: dailyRate })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Met à jour la résidence
 */
export async function updateClientNeedResidence(id: string, residence: string): Promise<void> {
  const { error } = await supabase
    .from('client_needs')
    .update({ residence })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Met à jour la mobilité
 */
export async function updateClientNeedMobility(id: string, mobility: string): Promise<void> {
  const { error } = await supabase
    .from('client_needs')
    .update({ mobility })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Met à jour le téléphone
 */
export async function updateClientNeedPhone(id: string, phone: string): Promise<void> {
  const { error } = await supabase
    .from('client_needs')
    .update({ phone })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Met à jour l'email
 */
export async function updateClientNeedEmail(id: string, email: string): Promise<void> {
  const { error } = await supabase
    .from('client_needs')
    .update({ email })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Marque un profil comme lu
 */
export async function markClientNeedAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('client_needs')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function toggleClientNeedReadStatus(id: string, currentStatus: boolean): Promise<void> {
  const { error } = await supabase
    .from('client_needs')
    .update({ is_read: !currentStatus })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Supprime un profil
 */
export async function deleteClientNeed(id: string): Promise<void> {
  try {
    const { data: clientNeed, error: fetchError } = await supabase
      .from('client_needs')
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching client need for deletion:', fetchError);
    }

    const { error } = await supabase
      .from('client_needs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Si un fichier est associé, le supprimer du stockage
    if (clientNeed?.file_url) {
      try {
        const { deleteFile } = await import('./fileUpload');
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