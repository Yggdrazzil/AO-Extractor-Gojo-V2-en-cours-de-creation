import { supabase, safeSupabaseOperation } from './supabaseClient';
import type { Prospect } from '../../types';
import { uploadFile, deleteFile } from '../fileUpload';
import { sendProspectNotification, getSalesRepCode } from '../prospectNotification';

/**
 * Récupère tous les prospects
 * @returns Liste des prospects
 */
export async function fetchProspects(): Promise<Prospect[]> {
  console.log('Fetching prospects...');
  
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
      .from('prospects')
      .select('id, text_content, file_name, file_url, file_content, target_account, availability, daily_rate, salary_expectations, residence, mobility, phone, email, status, assigned_to, is_read, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prospects:', error);
      
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
  
    console.log('Successfully fetched prospects:', { count: data.length });
    
    return data.map(prospect => ({
      id: prospect.id,
      textContent: prospect.text_content || '',
      fileName: prospect.file_name,
      fileUrl: prospect.file_url,
      fileContent: prospect.file_content,
      targetAccount: prospect.target_account || '',
      availability: prospect.availability || '-',
      dailyRate: prospect.daily_rate,
      salaryExpectations: prospect.salary_expectations,
      residence: prospect.residence || '-',
      mobility: prospect.mobility || '-',
      phone: prospect.phone || '-',
      email: prospect.email || '-',
      status: prospect.status,
      assignedTo: prospect.assigned_to,
      isRead: prospect.is_read || false
    }));
  } catch (error) {
    console.error('Failed to fetch prospects:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erreur lors du chargement des données');
    }
  }
}

/**
 * Crée un nouveau prospect
 * @param prospect - Données du prospect à créer
 * @param file - Fichier CV optionnel
 * @returns Prospect créé
 */
export async function createProspect(prospect: Omit<Prospect, 'id'>, file?: File | null): Promise<Prospect> {
  try {
    // Vérifier que le commercial existe
    const { data: salesRep, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('id, code')
      .eq('id', prospect.assignedTo)
      .single();

    if (salesRepError || !salesRep) {
      console.error('Sales rep not found:', prospect.assignedTo);
      throw new Error('Commercial non trouvé');
    }

    // Gérer l'upload du fichier si présent
    let fileUrl = prospect.fileUrl;
    let fileName = prospect.fileName;
    let fileContent = null;

    if (file) {
      try {
        const uploadResult = await uploadFile(file, 'cvs');
        fileUrl = uploadResult.url;
        fileName = file.name;
        fileContent = uploadResult.content;
        console.log('File uploaded successfully:', { url: fileUrl, content: fileContent?.substring(0, 100) + '...' });
      } catch (uploadError) {
        console.error('File upload failed:', uploadError);
        fileUrl = null;
        fileName = null;
        fileContent = null;
      }
    }

    // Préparer les données pour l'insertion
    const insertData = {
      text_content: prospect.textContent,
      file_name: fileName,
      file_url: fileUrl,
      file_content: fileContent,
      target_account: prospect.targetAccount,
      availability: prospect.availability,
      daily_rate: prospect.dailyRate,
      salary_expectations: prospect.salaryExpectations,
      residence: prospect.residence,
      mobility: prospect.mobility,
      phone: prospect.phone,
      email: prospect.email,
      status: prospect.status,
      assigned_to: prospect.assignedTo,
      is_read: prospect.isRead
    };

    console.log('Creating prospect with data:', insertData);

    // Insérer le prospect
    const { data, error } = await supabase
      .from('prospects')
      .insert([insertData])
      .select('id, text_content, file_name, file_url, file_content, target_account, availability, daily_rate, salary_expectations, residence, mobility, phone, email, status, assigned_to, is_read')
      .single();

    if (error) {
      console.error('Error creating prospect:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to create prospect');
    }
    
    console.log('Successfully created prospect:', data);

    // Envoi de la notification email (non bloquant)
    try {
      const salesRepCode = await getSalesRepCode(prospect.assignedTo);
      if (salesRepCode) {
        // Programmer l'envoi avec un délai de 30 secondes
        const emailScheduled = await sendProspectNotification({
          prospectId: data.id,
          targetAccount: data.target_account || '',
          salesRepCode,
          assignedTo: data.assigned_to,
          hasCV: !!data.file_name,
          fileName: data.file_name || undefined
        }, 0.5); // 30 secondes de délai (0.5 minute)
        
        if (emailScheduled) {
          console.log('Prospect email notification scheduled successfully (will be sent in 30 seconds)');
        } else {
          console.log('Prospect email notification could not be scheduled');
        }
      } else {
        console.warn('Could not send prospect email: sales rep code not found');
      }
    } catch (emailError) {
      console.warn('Prospect email notification scheduling failed (non-blocking):', emailError);
    }
    
    // Mapper les données pour le retour
    return {
      id: data.id,
      textContent: data.text_content,
      fileName: data.file_name,
      fileUrl: data.file_url,
      fileContent: data.file_content,
      targetAccount: data.target_account,
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
    console.error('Failed to create prospect:', error);
    throw error;
  }
}

/**
 * Met à jour le statut d'un prospect
 * @param id - ID du prospect
 * @param status - Nouveau statut
 */
export async function updateProspectStatus(id: string, status: Prospect['status']): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('prospects')
      .update({ status })
      .eq('id', id)
  );
}

/**
 * Met à jour le commercial assigné à un prospect
 * @param id - ID du prospect
 * @param assignedTo - ID du commercial
 */
export async function updateProspectAssignee(id: string, assignedTo: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('prospects')
      .update({ assigned_to: assignedTo })
      .eq('id', id)
  );
}

/**
 * Met à jour le compte ciblé d'un prospect
 * @param id - ID du prospect
 * @param targetAccount - Nouveau compte ciblé
 */
export async function updateProspectTargetAccount(id: string, targetAccount: string): Promise<void> {
  if (!id) {
    console.error('No prospect ID provided for target account update');
    return;
  }
  
  await safeSupabaseOperation(() => 
    supabase
      .from('prospects')
      .update({ target_account: targetAccount })
      .eq('id', id)
  );
}

/**
 * Met à jour la disponibilité d'un prospect
 * @param id - ID du prospect
 * @param availability - Nouvelle disponibilité
 */
export async function updateProspectAvailability(id: string, availability: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('prospects')
      .update({ availability })
      .eq('id', id)
  );
}

/**
 * Met à jour le TJM d'un prospect
 * @param id - ID du prospect
 * @param dailyRate - Nouveau TJM
 */
export async function updateProspectDailyRate(id: string, dailyRate: number | null): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('prospects')
      .update({ daily_rate: dailyRate })
      .eq('id', id)
  );
}

/**
 * Met à jour la résidence d'un prospect
 * @param id - ID du prospect
 * @param residence - Nouvelle résidence
 */
export async function updateProspectResidence(id: string, residence: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('prospects')
      .update({ residence })
      .eq('id', id)
  );
}

/**
 * Met à jour la mobilité d'un prospect
 * @param id - ID du prospect
 * @param mobility - Nouvelle mobilité
 */
export async function updateProspectMobility(id: string, mobility: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('prospects')
      .update({ mobility })
      .eq('id', id)
  );
}

/**
 * Met à jour le téléphone d'un prospect
 * @param id - ID du prospect
 * @param phone - Nouveau téléphone
 */
export async function updateProspectPhone(id: string, phone: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('prospects')
      .update({ phone })
      .eq('id', id)
  );
}

/**
 * Met à jour l'email d'un prospect
 * @param id - ID du prospect
 * @param email - Nouvel email
 */
export async function updateProspectEmail(id: string, email: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('prospects')
      .update({ email })
      .eq('id', id)
  );
}

/**
 * Supprime un prospect
 * @param id - ID du prospect
 */
export async function deleteProspect(id: string): Promise<void> {
  try {
    // Récupérer l'URL du fichier avant suppression
    const { data: prospect, error: fetchError } = await supabase
      .from('prospects')
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching prospect for deletion:', fetchError);
    }

    // Supprimer le prospect
    await safeSupabaseOperation(() => 
      supabase
        .from('prospects')
        .delete()
        .eq('id', id)
    );

    // Supprimer le fichier associé si présent
    if (prospect?.file_url) {
      try {
        const url = new URL(prospect.file_url);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(-2).join('/');
        
        await deleteFile(filePath);
        console.log('File deleted from storage:', filePath);
      } catch (fileError) {
        console.error('Error deleting file from storage:', fileError);
      }
    }
  } catch (error) {
    console.error('Error in deleteProspect:', error);
    throw error;
  }
}

/**
 * Marque un prospect comme lu
 * @param id - ID du prospect
 */
export async function markProspectAsRead(id: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('prospects')
      .update({ is_read: true })
      .eq('id', id)
  );
}