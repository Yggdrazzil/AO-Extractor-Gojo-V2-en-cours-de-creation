import { supabase } from '../lib/supabase';
import type { Prospect } from '../types';
import { uploadFile, deleteFile } from './fileUpload';
import { sendProspectNotification, getSalesRepCode } from './prospectNotification';

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
      .select('id, text_content, file_name, file_url, file_content, target_account, name, availability, daily_rate, residence, mobility, phone, email, status, assigned_to, is_read, created_at, comments')
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
      name: (prospect as any).name || '-',
      availability: prospect.availability || '-',
      dailyRate: prospect.daily_rate,
      residence: prospect.residence || '-',
      mobility: prospect.mobility || '-',
      phone: prospect.phone || '-',
      email: prospect.email || '-',
      status: prospect.status,
      assignedTo: prospect.assigned_to,
      isRead: prospect.is_read || false,
      comments: (prospect as any).comments || ''
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

    const insertData = {
      text_content: prospect.textContent,
      file_name: fileName,
      file_url: fileUrl,
      file_content: fileContent,
      target_account: prospect.targetAccount,
      name: prospect.name || '-',
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

    const { data, error } = await supabase
      .from('prospects')
      .insert([{ ...insertData, comments: '' }])
      .select('id, text_content, file_name, file_url, file_content, target_account, name, availability, daily_rate, salary_expectations, residence, mobility, phone, email, status, assigned_to, is_read, comments')
      .single();

    if (error) {
      console.error('Error creating prospect:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to create prospect');
    }
    
    console.log('Successfully created prospect:', data);

    // ✅ Envoi de la notification email (non bloquant)
    try {
      const salesRepCode = await getSalesRepCode(prospect.assignedTo);
      if (salesRepCode) {
        console.log('🔔 Sending immediate prospect email notification for:', salesRepCode);
        // Envoi immédiat après création du prospect
        const emailScheduled = await sendProspectNotification({
          prospectId: data.id,
          targetAccount: data.target_account || '',
          salesRepCode,
          assignedTo: data.assigned_to,
          hasCV: !!data.file_name,
          fileName: data.file_name || undefined
        }, 0); // Aucun délai
        
        if (emailScheduled) {
          console.log('✅ Prospect email notification sent successfully');
        } else {
          console.log('⚠️ Prospect email notification failed');
        }
      } else {
        console.warn('⚠️ Could not send prospect email: sales rep code not found');
      }
    } catch (emailError) {
      console.error('❌ Prospect email notification failed (non-blocking):', emailError);
    }
    
    return {
      id: data.id,
      textContent: data.text_content,
      fileName: data.file_name,
      fileUrl: data.file_url,
      fileContent: data.file_content,
      targetAccount: data.target_account,
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
    console.error('Failed to create prospect:', error);
    throw error;
  }
}

export async function updateProspectComments(id: string, comments: string): Promise<void> {
  try {
    console.log('💾 Updating prospect comments for ID:', id, 'Content length:', comments.length);
    
    if (!id) {
      console.error('No prospect ID provided for comments update');
      return;
    }
    
    const { error } = await supabase
      .from('prospects')
      .update({ comments })
      .eq('id', id);

    if (error) {
      console.error('Failed to update prospect comments:', error);
      throw error;
    }
    
    console.log('✅ Prospect comments updated successfully in database');
  } catch (error) {
    console.error('Error in updateProspectComments:', error);
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

export async function updateProspectName(id: string, name: string): Promise<void> {
  if (!id) {
    console.error('No prospect ID provided for name update');
    return;
  }

  const { error } = await supabase
    .from('prospects')
    .update({ name })
    .eq('id', id);

  if (error) {
    console.error('Failed to update name:', error);
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
    const { data: prospect, error: fetchError } = await supabase
      .from('prospects')
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching prospect for deletion:', fetchError);
    }

    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', id);

    if (error) throw error;

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

export async function toggleProspectReadStatus(id: string, currentStatus: boolean): Promise<void> {
  try {
    const { error } = await supabase
      .from('prospects')
      .update({ is_read: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Failed to toggle prospect read status:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in toggleProspectReadStatus:', error);
    throw error;
  }
}