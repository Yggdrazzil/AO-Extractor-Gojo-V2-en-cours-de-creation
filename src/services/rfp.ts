import { supabase } from '../lib/supabase';
import type { RFP } from '../types';

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

export async function fetchRFPs(): Promise<RFP[]> {
  console.log('Fetching RFPs...');
  
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

    console.log('Auth check passed:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userId: session?.user?.id
    });

    // Essayer d'abord avec la colonne comments, sinon sans
    let { data, error } = await supabase
      .from('rfps')
      .select('id, client, mission, location, max_rate, created_at, start_date, status, assigned_to, raw_content, is_read, comments')
      .order('created_at', { ascending: false });

    // Si erreur avec comments, réessayer sans
    if (error && error.message.includes('comments')) {
      console.log('Comments column not found, fetching without it...');
      const result = await supabase
        .from('rfps')
        .select('id, client, mission, location, max_rate, created_at, start_date, status, assigned_to, raw_content, is_read')
        .order('created_at', { ascending: false });
      data = result.data;
      error = result.error;
    }

    console.log('Supabase query result:', {
      hasData: !!data,
      dataLength: data?.length,
      error: error,
      errorCode: error?.code,
      errorMessage: error?.message
    });

    if (error) {
      console.error('Error fetching RFPs:', error);
      
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
  
    console.log('Successfully fetched RFPs:', { count: data.length });
    
    return data.map(rfp => ({
      id: rfp.id,
      client: rfp.client || '',
      mission: rfp.mission || '',
      location: rfp.location || '',
      maxRate: rfp.max_rate,
      createdAt: rfp.created_at,
      startDate: rfp.start_date,
      status: rfp.status,
      assignedTo: rfp.assigned_to,
      content: rfp.raw_content || '',
      isRead: rfp.is_read || false,
      comments: (rfp as any).comments || ''
    }));
  } catch (error) {
    console.error('Failed to fetch RFPs:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erreur lors du chargement des données');
    }
  }
}

export async function createRFP(rfp: Omit<RFP, 'id'>): Promise<RFP> {
  try {
    const { data: salesRep, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('id, code')
      .eq('id', rfp.assignedTo)
      .single();

    if (salesRepError || !salesRep) {
      console.error('Sales rep not found:', rfp.assignedTo);
      throw new Error('Commercial non trouvé');
    }

    const insertData = {
      client: rfp.client,
      mission: rfp.mission,
      location: rfp.location,
      max_rate: rfp.maxRate,
      created_at: convertFrenchDateToISO(rfp.createdAt),
      start_date: convertFrenchDateToISO(rfp.startDate) || new Date().toISOString(),
      status: rfp.status,
      assigned_to: rfp.assignedTo,
      raw_content: rfp.content || '',
      is_read: false,
      comments: ''
    };

    console.log('Creating RFP with data:', insertData);

    const { data, error } = await supabase
      .from('rfps')
      .insert([insertData]) 
      .select('id, client, mission, location, max_rate, created_at, start_date, status, assigned_to, raw_content, is_read, comments')
      .single();


    if (error) {
      console.error('Error creating RFP:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to create RFP');
    }
    
    console.log('Successfully created RFP:', data);
    
    return {
      id: data.id,
      client: data.client,
      mission: data.mission,
      location: data.location,
      maxRate: data.max_rate,
      createdAt: data.created_at,
      startDate: data.start_date,
      status: data.status,
      assignedTo: data.assigned_to,
      content: data.raw_content,
      isRead: data.is_read || false,
      comments: data.comments || ''
    };
  } catch (error) {
    console.error('Failed to create RFP:', error);
    throw error;
  }
}

export async function updateRFPStatus(id: string, status: RFP['status']): Promise<void> {
  const { error } = await supabase
    .from('rfps')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function updateRFPAssignee(id: string, assignedTo: string): Promise<void> {
  const { error } = await supabase
    .from('rfps')
    .update({ assigned_to: assignedTo })
    .eq('id', id);

  if (error) throw error;
}

export async function updateRFPClient(id: string, client: string): Promise<void> {
  const { error } = await supabase
    .from('rfps')
    .update({ client })
    .eq('id', id);

  if (error) throw error;
}

export async function updateRFPMission(id: string, mission: string): Promise<void> {
  const { error } = await supabase
    .from('rfps')
    .update({ mission })
    .eq('id', id);

  if (error) throw error;
}

export async function updateRFPLocation(id: string, location: string): Promise<void> {
  const { error } = await supabase
    .from('rfps')
    .update({ location })
    .eq('id', id);

  if (error) throw error;
}

export async function updateRFPMaxRate(id: string, max_rate: number | null): Promise<void> {
  const { error } = await supabase
    .from('rfps')
    .update({ max_rate })
    .eq('id', id);

  if (error) throw error;
}

export async function updateRFPStartDate(id: string, startDate: string | null): Promise<void> {
  const isoDate = startDate ? convertFrenchDateToISO(startDate) : null;
  if (!id) {
    console.error('No RFP ID provided for start date update');
    return;
  }
  
  const { error } = await supabase
    .from('rfps')
    .update({ start_date: isoDate })
    .eq('id', id);

  if (error) {
    console.error('Failed to update start date:', error);
    throw error;
  }
}

export async function updateRFPCreatedAt(id: string, createdAt: string | null): Promise<void> {
  const isoDate = createdAt ? convertFrenchDateToISO(createdAt) : null;
  if (!id) {
    console.error('No RFP ID provided for created date update');
    return;
  }
  
  const { error } = await supabase
    .from('rfps')
    .update({ created_at: isoDate })
    .eq('id', id);

  if (error) {
    console.error('Failed to update created at:', error);
    throw error;
  }
}

export async function updateRFPComments(id: string, comments: string): Promise<void> {
  try {
    if (!id) {
      console.error('No RFP ID provided for comments update');
      return;
    }
    
    const { error } = await supabase
      .from('rfps')
      .update({ comments })
      .eq('id', id);

    if (error) {
      // Si la colonne comments n'existe pas, on ignore silencieusement
      if (error.message.includes('comments')) {
        console.warn('Comments column does not exist yet, skipping update');
        return;
      }
      console.error('Failed to update comments:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateRFPComments:', error);
    throw error;
  }
}

export async function deleteRFP(id: string): Promise<void> {
  const { error } = await supabase
    .from('rfps')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function markRFPAsRead(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('rfps')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking RFP as read:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to mark RFP as read:', error);
    throw error;
  }
}