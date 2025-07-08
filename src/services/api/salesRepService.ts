import { supabase } from './supabaseClient';
import type { SalesRep } from '../../types';

/**
 * Récupère tous les commerciaux depuis la base de données
 */
export async function fetchSalesReps(): Promise<SalesRep[]> {
  console.log('Starting fetchSalesReps function...');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth check:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userId: session?.user?.id
    });

    if (!session) {
      console.warn('No active session, cannot fetch sales reps');
      return [];
    }

    console.log('Attempting to fetch from sales_reps table...');
    const { data: salesReps, error: salesRepsError } = await supabase
      .from('sales_reps')
      .select('id, code, name, email, is_admin, created_at')
      .order('code');

    console.log('Supabase response:', {
      hasData: !!salesReps,
      dataLength: salesReps?.length,
      error: salesRepsError,
      firstRecord: salesReps?.[0]
    });

    if (salesRepsError) {
      console.error('Error fetching sales reps:', salesRepsError);
      // Ne pas lancer d'erreur si c'est juste un problème d'autorisation
      if (salesRepsError.code === 'PGRST301' || salesRepsError.code === '42501') {
        console.warn('Authorization issue, returning empty array');
        return [];
      }
      throw salesRepsError;
    }

    return salesReps || [];
  } catch (error) {
    console.error('Failed to fetch sales reps:', error);
    return [];
  }
}

/**
 * Vérifie si l'utilisateur connecté a des droits administrateur
 */
export async function checkAdminRights(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.email) {
      return false;
    }

    // Récupérer les informations du commercial basé sur l'email
    const { data: salesRep, error } = await supabase
      .from('sales_reps')
      .select('is_admin')
      .eq('email', session.user.email)
      .single();

    if (error || !salesRep) {
      console.warn('Sales rep not found for email:', session.user.email);
      return false;
    }

    return salesRep.is_admin || false;
  } catch (error) {
    console.error('Error checking admin rights:', error);
    return false;
  }
}

/**
 * Récupère les informations du commercial connecté
 */
export async function getCurrentSalesRep() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.email) {
      return null;
    }

    const { data: salesRep, error } = await supabase
      .from('sales_reps')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (error || !salesRep) {
      console.warn('Sales rep not found for email:', session.user.email);
      return null;
    }

    return salesRep;
  } catch (error) {
    console.error('Error getting current sales rep:', error);
    return null;
  }
}

/**
 * Récupère le code commercial depuis l'ID
 */
export async function getSalesRepCode(salesRepId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('code')
      .eq('id', salesRepId)
      .single();

    if (error || !data) {
      console.error('Error fetching sales rep code:', error);
      return null;
    }

    return data.code;
  } catch (error) {
    console.error('Failed to get sales rep code:', error);
    return null;
  }
}