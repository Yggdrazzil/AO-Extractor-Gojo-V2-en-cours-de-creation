import { supabase, safeSupabaseOperation } from './supabaseClient';
import type { RFP } from '../../types';
import { convertFrenchDateToISO } from '../../utils/dateUtils';

/**
 * Récupère tous les RFPs
 * @returns Liste des RFPs
 */
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

    const { data, error } = await supabase
      .from('rfps')
      .select('id, client, mission, location, max_rate, created_at, start_date, status, assigned_to, raw_content, is_read')
      .order('created_at', { ascending: false });

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
      isRead: rfp.is_read || false
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

/**
 * Crée un nouveau RFP
 * @param rfp - Données du RFP à créer
 * @returns RFP créé
 */
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

    // Préparer les données pour l'insertion
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
      is_read: false
    };

    console.log('Creating RFP with data:', insertData);

    // Insérer le RFP
    const { data, error } = await supabase
      .from('rfps')
      .insert([insertData])
      .select('id, client, mission, location, max_rate, created_at, start_date, status, assigned_to, raw_content, is_read')
      .single();

    if (error) {
      console.error('Error creating RFP:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to create RFP');
    }
    
    console.log('Successfully created RFP:', data);
    
    // Mapper les données pour le retour
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
      isRead: data.is_read || false
    };
  } catch (error) {
    console.error('Failed to create RFP:', error);
    throw error;
  }
}

/**
 * Met à jour le statut d'un RFP
 * @param id - ID du RFP
 * @param status - Nouveau statut
 */
export async function updateRFPStatus(id: string, status: RFP['status']): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('rfps')
      .update({ status })
      .eq('id', id)
  );
}

/**
 * Met à jour le commercial assigné à un RFP
 * @param id - ID du RFP
 * @param assignedTo - ID du commercial
 */
export async function updateRFPAssignee(id: string, assignedTo: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('rfps')
      .update({ assigned_to: assignedTo })
      .eq('id', id)
  );
}

/**
 * Met à jour le client d'un RFP
 * @param id - ID du RFP
 * @param client - Nouveau client
 */
export async function updateRFPClient(id: string, client: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('rfps')
      .update({ client })
      .eq('id', id)
  );
}

/**
 * Met à jour la mission d'un RFP
 * @param id - ID du RFP
 * @param mission - Nouvelle mission
 */
export async function updateRFPMission(id: string, mission: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('rfps')
      .update({ mission })
      .eq('id', id)
  );
}

/**
 * Met à jour la localisation d'un RFP
 * @param id - ID du RFP
 * @param location - Nouvelle localisation
 */
export async function updateRFPLocation(id: string, location: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('rfps')
      .update({ location })
      .eq('id', id)
  );
}

/**
 * Met à jour le TJM maximum d'un RFP
 * @param id - ID du RFP
 * @param maxRate - Nouveau TJM maximum
 */
export async function updateRFPMaxRate(id: string, maxRate: number | null): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('rfps')
      .update({ max_rate: maxRate })
      .eq('id', id)
  );
}

/**
 * Met à jour la date de démarrage d'un RFP
 * @param id - ID du RFP
 * @param startDate - Nouvelle date de démarrage
 */
export async function updateRFPStartDate(id: string, startDate: string | null): Promise<void> {
  const isoDate = startDate ? convertFrenchDateToISO(startDate) : null;
  
  if (!id) {
    console.error('No RFP ID provided for start date update');
    return;
  }
  
  await safeSupabaseOperation(() => 
    supabase
      .from('rfps')
      .update({ start_date: isoDate })
      .eq('id', id)
  );
}

/**
 * Met à jour la date de création d'un RFP
 * @param id - ID du RFP
 * @param createdAt - Nouvelle date de création
 */
export async function updateRFPCreatedAt(id: string, createdAt: string | null): Promise<void> {
  const isoDate = createdAt ? convertFrenchDateToISO(createdAt) : null;
  
  if (!id) {
    console.error('No RFP ID provided for created date update');
    return;
  }
  
  await safeSupabaseOperation(() => 
    supabase
      .from('rfps')
      .update({ created_at: isoDate })
      .eq('id', id)
  );
}

/**
 * Supprime un RFP
 * @param id - ID du RFP
 */
export async function deleteRFP(id: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('rfps')
      .delete()
      .eq('id', id)
  );
}

/**
 * Marque un RFP comme lu
 * @param id - ID du RFP
 */
export async function markRFPAsRead(id: string): Promise<void> {
  await safeSupabaseOperation(() => 
    supabase
      .from('rfps')
      .update({ is_read: true })
      .eq('id', id)
  );
}