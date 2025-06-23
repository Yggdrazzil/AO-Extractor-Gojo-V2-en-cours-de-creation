import { supabase } from '../lib/supabase';

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