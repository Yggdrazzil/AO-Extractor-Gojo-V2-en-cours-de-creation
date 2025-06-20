import { supabase } from '../lib/supabase';
import type { RFP } from '../types';

function convertFrenchDateToISO(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  // Nettoyer la chaîne de caractères
  const cleanDateStr = dateStr.trim();
  
  try {
    let date: Date;
    
    // Vérifier le format JJ/MM/AAAA
    const frenchMatch = cleanDateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (frenchMatch) {
      const [, day, month, year] = frenchMatch;
      // Créer la date en UTC
      date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    } else {
      // Essayer de parser comme une date ISO
      date = new Date(cleanDateStr);
    }
    
    // Vérifier si la date est valide
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
    // Vérifier la session avant de faire la requête
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

    // D'abord, essayer avec la colonne is_read
    let { data, error } = await supabase
      .from('rfps')
      .select(`
        id,
        client,
        mission,
        location,
        max_rate,
        created_at,
        start_date,
        status,
        assigned_to,
        raw_content,
        is_read
      `)
      .order('created_at', { ascending: false });

    // Si erreur avec is_read, essayer sans cette colonne
    if (error && error.message?.includes('is_read')) {
      console.warn('is_read column not found, fetching without it...');
      const result = await supabase
        .from('rfps')
        .select(`
          id,
          client,
          mission,
          location,
          max_rate,
          created_at,
          start_date,
          status,
          assigned_to,
          raw_content
        `)
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
      
      // Gérer différents types d'erreurs
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
    
    // Transformer les données pour correspondre au format de l'application
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
      isRead: (rfp as any).is_read !== undefined ? (rfp as any).is_read : false
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
    // Vérifier que le commercial existe
    const { data: salesRep, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('id, code')
      .eq('id', rfp.assignedTo)
      .single();

    if (salesRepError || !salesRep) {
      console.error('Sales rep not found:', rfp.assignedTo);
      throw new Error('Commercial non trouvé');
    }

    const insertData: any = {
      client: rfp.client,
      mission: rfp.mission,
      location: rfp.location,
      max_rate: rfp.maxRate,
      created_at: convertFrenchDateToISO(rfp.createdAt),
      start_date: convertFrenchDateToISO(rfp.startDate) || new Date().toISOString(),
      status: rfp.status,
      assigned_to: rfp.assignedTo,
      raw_content: rfp.content || ''
    };

    // Essayer d'ajouter is_read si la colonne existe
    try {
      insertData.is_read = false;
    } catch (e) {
      console.warn('is_read column may not exist, proceeding without it');
    }

    console.log('Creating RFP with data:', insertData);

    const { data, error } = await supabase
      .from('rfps')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating RFP:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to create RFP');
    }
    
    console.log('Successfully created RFP:', data);
    
    // Convertir les champs de la base de données au format de l'application
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
      isRead: (data as any).is_read !== undefined ? (data as any).is_read : false
    };
  } catch (error) {
    console.error('Failed to create RFP:', error);
    throw error;
  }
}

export async function markRFPAsRead(id: string): Promise<void> {
  console.log('Marking RFP as read:', id);
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      throw new Error('Authentication required');
    }

    // Essayer de mettre à jour is_read
    const { error } = await supabase
      .from('rfps')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Failed to mark RFP as read:', error);
      if (error.code === 'PGRST301') {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      // Ne pas lancer d'erreur si la colonne is_read n'existe pas
      if (error.message?.includes('is_read')) {
        console.warn('is_read column not available, skipping update');
        return;
      }
      throw error;
    }
    console.log('Successfully marked RFP as read');
  } catch (error) {
    console.error('Error in markRFPAsRead:', error);
    // Ne pas lancer d'erreur pour les problèmes de colonne is_read
    if (error instanceof Error && error.message.includes('is_read')) {
      console.warn('Skipping read status update due to column issue');
      return;
    }
    throw error;
  }
}

export async function toggleRFPReadStatus(id: string, isRead: boolean): Promise<void> {
  console.log('Toggling RFP read status:', { id, isRead });

  try {
    const { error } = await supabase
      .from('rfps')
      .update({ is_read: isRead })
      .eq('id', id);

    if (error) {
      console.error('Error toggling RFP read status:', error);
      // Ne pas lancer d'erreur si la colonne is_read n'existe pas
      if (error.message?.includes('is_read')) {
        console.warn('is_read column not available, skipping update');
        return;
      }
      throw error;
    }

    console.log('Successfully toggled RFP read status');
  } catch (error) {
    console.error('Error in toggleRFPReadStatus:', error);
    // Ne pas lancer d'erreur pour les problèmes de colonne is_read
    if (error instanceof Error && error.message.includes('is_read')) {
      console.warn('Skipping read status toggle due to column issue');
      return;
    }
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

export async function deleteRFP(id: string): Promise<void> {
  const { error } = await supabase
    .from('rfps')
    .delete()
    .eq('id', id);

  if (error) throw error;
}