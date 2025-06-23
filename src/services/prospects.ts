import { supabase } from '../lib/supabase';
import type { Prospect } from '../types';
import { uploadFile, deleteFile } from './fileUpload';

function convertFrenchDateToISO(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  const cleanDateStr = dateStr.trim();
  
  try {
    let date: Date;
    
    const frenchMatch = cleanDateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (frenchMatch) {
      const [, day, month, year] = frenchMatch;
      date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    } else {
      date = new Date(cleanDateStr);
    }
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', cleanDateStr);
      return null;
    }
    
    return date.toISOString();
  } catch (error) {
    console.error('Error converting date:', { dateStr: cleanDateStr, error });
    return null;
  }
}

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
      .select('id, text_content, file_name, file_url, file_content, target_account, availability, daily_rate, residence, mobility, phone, email, status, assigned_to, is_read, created_at')
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
      availability: prospect.availability || '',
      dailyRate: prospect.daily_rate,
      residence: prospect.residence || '',
      mobility: prospect.mobility || '',
      phone: prospect.phone || '',
      email: prospect.email || '',
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

export async function createProspect(prospect: Omit<Prospect, 'id'>, file?: File): Promise<Prospect> {
  try {
    const { data: salesRep, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('id, code')
      .eq('id', prospect.assignedTo)
      .single();

    if (salesRepError || !salesRep) {
      console.error('Sales rep not found:', prospect.assignedTo);
      throw new Error('Commercial non trouvé');
    }

    let fileUrl = prospect.fileUrl;
    let fileName = prospect.fileName;
    let fileContent = null;

    // Upload du fichier si fourni
    if (file) {
      try {
        const uploadResult = await uploadFile(file, 'cvs');
        fileUrl = uploadResult.url;
        fileName = file.name;
        fileContent = uploadResult.content;
        console.log('File uploaded successfully:', { url: fileUrl, content: fileContent?.substring(0, 100) + '...' });
      } catch (uploadError) {
        console.error('File upload failed:', uploadError);
        // Continuer sans le fichier plutôt que d'échouer complètement
        fileUrl = null;
        fileName = null;
        fileContent = null;
      }
    }
    const insertData: any = {
      text_content: prospect.textContent,
      file_name: fileName,
      file_url: fileUrl,
      file_content: fileContent,
      target_account: prospect.targetAccount,
      availability: prospect.availability,
      daily_rate: prospect.dailyRate,
      residence: prospect.residence,
      mobility: prospect.mobility,
      phone: prospect.phone,
      email: prospect.email,
      status: prospect.status,
      assigned_to: prospect.assignedTo,
      is_read: prospect.isRead
    };

    console.log('Creating prospect with data:', insertData);

    const { data, error } = await supabase
      .from('prospects')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating prospect:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to create prospect');
    }
    
    console.log('Successfully created prospect:', data);
    
    return {
      id: data.id,
      textContent: data.text_content,
      fileName: data.file_name,
      fileUrl: data.file_url,
      fileContent: data.file_content,
      targetAccount: data.target_account,
      availability: data.availability || '-',
      dailyRate: data.daily_rate,
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

export async function updateProspectStatus(id: string, status: Prospect['status']): Promise<void> {
  const { error } = await supabase
    .from('prospects')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function updateProspectAssignee(id: string, assignedTo: string): Promise<void> {
  const { error } = await supabase
    .from('prospects')
    .update({ assigned_to: assignedTo })
    .eq('id', id);

  if (error) throw error;
}

export async function updateProspectTargetAccount(id: string, targetAccount: string): Promise<void> {
  if (!id) {
    console.error('No prospect ID provided for target account update');
    return;
  }
  
  const { error } = await supabase
    .from('prospects')
    .update({ target_account: targetAccount })
    .eq('id', id);

  if (error) {
    console.error('Failed to update target account:', error);
    throw error;
  }
}

export async function updateProspectAvailability(id: string, availability: string): Promise<void> {
  const { error } = await supabase
    .from('prospects')
    .update({ availability })
    .eq('id', id);

  if (error) throw error;
}

export async function updateProspectDailyRate(id: string, daily_rate: number | null): Promise<void> {
  const { error } = await supabase
    .from('prospects')
    .update({ daily_rate })
    .eq('id', id);

  if (error) throw error;
}

export async function updateProspectResidence(id: string, residence: string): Promise<void> {
  const { error } = await supabase
    .from('prospects')
    .update({ residence })
    .eq('id', id);

  if (error) throw error;
}

export async function updateProspectMobility(id: string, mobility: string): Promise<void> {
  const { error } = await supabase
    .from('prospects')
    .update({ mobility })
    .eq('id', id);

  if (error) throw error;
}

export async function updateProspectPhone(id: string, phone: string): Promise<void> {
  const { error } = await supabase
    .from('prospects')
    .update({ phone })
    .eq('id', id);

  if (error) throw error;
}

export async function updateProspectEmail(id: string, email: string): Promise<void> {
  const { error } = await supabase
    .from('prospects')
    .update({ email })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProspect(id: string): Promise<void> {
  try {
    // Récupérer les informations du fichier avant suppression
    const { data: prospect, error: fetchError } = await supabase
      .from('prospects')
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching prospect for deletion:', fetchError);
    }

    // Supprimer l'enregistrement de la base de données
    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Supprimer le fichier du storage si il existe
    if (prospect?.file_url) {
      try {
        // Extraire le chemin du fichier depuis l'URL
        const url = new URL(prospect.file_url);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(-2).join('/'); // Récupérer "cvs/filename"
        
        await deleteFile(filePath);
        console.log('File deleted from storage:', filePath);
      } catch (fileError) {
        console.error('Error deleting file from storage:', fileError);
        // Ne pas faire échouer la suppression si le fichier ne peut pas être supprimé
      }
    }
  } catch (error) {
    console.error('Error in deleteProspect:', error);
    throw error;
  }
}

// Fonction pour supprimer l'ancienne version
export async function deleteProspectOld(id: string): Promise<void> {
  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function markProspectAsRead(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('prospects')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking prospect as read:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to mark prospect as read:', error);
    throw error;
  }
}