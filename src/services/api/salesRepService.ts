import { supabase, safeSupabaseOperation } from './supabaseClient';
import type { SalesRep } from '../../types';
import { SALES_REP_ORDER } from '../../utils/constants';

/**
 * Récupère tous les commerciaux
 * @returns Liste des commerciaux
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
    // Retourner un tableau vide plutôt que de lancer une erreur
    return [];
  }
}

/**
 * Récupère un commercial par son ID
 * @param id - ID du commercial
 * @returns Commercial ou null si non trouvé
 */
export async function getSalesRepById(id: string): Promise<SalesRep | null> {
  try {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('id, code, name, email, is_admin, created_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching sales rep by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get sales rep by ID:', error);
    return null;
  }
}

/**
 * Récupère un commercial par son email
 * @param email - Email du commercial
 * @returns Commercial ou null si non trouvé
 */
export async function getSalesRepByEmail(email: string): Promise<SalesRep | null> {
  try {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('id, code, name, email, is_admin, created_at')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching sales rep by email:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get sales rep by email:', error);
    return null;
  }
}

/**
 * Récupère le code d'un commercial par son ID
 * @param salesRepId - ID du commercial
 * @returns Code du commercial ou null si non trouvé
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

/**
 * Trie les commerciaux selon l'ordre défini
 * @param salesReps - Liste des commerciaux à trier
 * @returns Liste triée des commerciaux
 */
export function sortSalesReps(salesReps: SalesRep[]): SalesRep[] {
  return [...salesReps].sort((a, b) => {
    return SALES_REP_ORDER.indexOf(a.code) - SALES_REP_ORDER.indexOf(b.code);
  });
}

/**
 * Vérifie si l'utilisateur connecté a des droits administrateur
 * @returns true si l'utilisateur est admin, false sinon
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