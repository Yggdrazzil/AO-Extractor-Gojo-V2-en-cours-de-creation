import { supabase } from '../lib/supabase';
import type { Need } from '../types';

/**
 * Service pour la gestion des besoins clients internes
 */

export async function fetchNeeds(): Promise<Need[]> {
  console.log('Fetching needs...');
  
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
      .from('needs')
      .select(`
        id, 
        title, 
        client, 
        status, 
        created_by, 
        created_at, 
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching needs:', error);
      throw new Error(error.message || 'Erreur lors du chargement des besoins');
    }
  
    if (!data) {
      console.warn('No data returned from Supabase');
      return [];
    }
  
    console.log('Successfully fetched needs:', { count: data.length });
    
    return data.map(need => ({
      id: need.id,
      title: need.title,
      client: need.client,
      status: need.status,
      createdBy: need.created_by,
      createdAt: need.created_at,
      updatedAt: need.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch needs:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erreur lors du chargement des besoins');
    }
  }
}

export async function createNeed(need: Omit<Need, 'id' | 'createdAt' | 'updatedAt'>): Promise<Need> {
  try {
    console.log('Creating need:', need);

    const insertData = {
      title: need.title,
      client: need.client,
      status: need.status,
      created_by: need.createdBy
    };

    const { data, error } = await supabase
      .from('needs')
      .insert([insertData])
      .select(`
        id, 
        title, 
        client, 
        status, 
        created_by, 
        created_at, 
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error creating need:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to create need');
    }
    
    console.log('Successfully created need:', data);
    
    return {
      id: data.id,
      title: data.title,
      client: data.client,
      status: data.status,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Failed to create need:', error);
    throw error;
  }
}

export async function updateNeed(id: string, updates: Partial<Pick<Need, 'title' | 'client' | 'status'>>): Promise<void> {
  try {
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.client !== undefined) updateData.client = updates.client;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { error } = await supabase
      .from('needs')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating need:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to update need:', error);
    throw error;
  }
}

export async function deleteNeed(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('needs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting need:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete need:', error);
    throw error;
  }
}

export async function fetchOpenNeeds(): Promise<Need[]> {
  try {
    const { data, error } = await supabase
      .from('needs')
      .select(`
        id, 
        title, 
        client, 
        status, 
        created_by, 
        created_at, 
        updated_at
      `)
      .in('status', ['Ouvert', 'En cours'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching open needs:', error);
      throw error;
    }

    return (data || []).map(need => ({
      id: need.id,
      title: need.title,
      client: need.client,
      status: need.status,
      createdBy: need.created_by,
      createdAt: need.created_at,
      updatedAt: need.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch open needs:', error);
    throw error;
  }
}