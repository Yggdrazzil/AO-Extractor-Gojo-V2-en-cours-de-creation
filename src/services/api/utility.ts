import { supabase } from './supabaseClient';

/**
 * Utilitaires pour vérifier et débloquer les permissions Supabase
 */

/**
 * Vérifie si l'utilisateur a accès à une table spécifique
 * @param tableName Nom de la table à vérifier
 * @returns true si l'utilisateur a accès, false sinon
 */
export async function checkTableAccess(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('count', { head: true, count: 'exact' });
    
    return !error;
  } catch (error) {
    console.error(`Failed to check access to table ${tableName}:`, error);
    return false;
  }
}

/**
 * Vérifie si l'utilisateur est un administrateur
 * @returns true si l'utilisateur est admin, false sinon
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.email) {
      return false;
    }
    
    const { data: salesRep, error } = await supabase
      .from('sales_reps')
      .select('is_admin')
      .eq('email', session.user.email)
      .single();
    
    if (error || !salesRep) {
      return false;
    }
    
    return !!salesRep.is_admin;
  } catch (error) {
    console.error('Failed to check admin status:', error);
    return false;
  }
}

/**
 * Récupère l'ID du commercial connecté
 * @returns ID du commercial ou null si non trouvé
 */
export async function getCurrentSalesRepId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.email) {
      return null;
    }
    
    const { data: salesRep, error } = await supabase
      .from('sales_reps')
      .select('id')
      .eq('email', session.user.email)
      .single();
    
    if (error || !salesRep) {
      return null;
    }
    
    return salesRep.id;
  } catch (error) {
    console.error('Failed to get current sales rep ID:', error);
    return null;
  }
}

/**
 * Vérifie l'état de santé global de la connexion Supabase
 * @returns Objet contenant l'état de santé des différentes composantes
 */
export async function checkSupabaseHealth(): Promise<{
  connection: boolean;
  auth: boolean;
  database: boolean;
  storage: boolean;
  tables: Record<string, boolean>;
}> {
  try {
    // Vérifier la connexion
    const connection = await checkSupabaseConnection();
    
    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession();
    const auth = !!session;
    
    // Vérifier l'accès aux tables principales
    const tables = {
      sales_reps: await checkTableAccess('sales_reps'),
      rfps: await checkTableAccess('rfps'),
      prospects: await checkTableAccess('prospects'),
      client_needs: await checkTableAccess('client_needs'),
      needs: await checkTableAccess('needs'),
      linkedin_links: await checkTableAccess('linkedin_links')
    };
    
    // Vérifier l'accès au storage
    let storage = false;
    try {
      const { data } = await supabase.storage.getBucket('files');
      storage = !!data;
    } catch {
      // Si l'API getBucket n'est pas supportée, essayer de lister les buckets
      try {
        const { data } = await supabase.storage.listBuckets();
        storage = Array.isArray(data);
      } catch {
        storage = false;
      }
    }
    
    // Vérifier l'accès à la base de données en général
    const database = Object.values(tables).some(access => access);
    
    return {
      connection,
      auth,
      database,
      storage,
      tables
    };
  } catch (error) {
    console.error('Failed to check Supabase health:', error);
    return {
      connection: false,
      auth: false,
      database: false,
      storage: false,
      tables: {
        sales_reps: false,
        rfps: false,
        prospects: false,
        client_needs: false,
        needs: false,
        linkedin_links: false
      }
    };
  }
}

/**
 * Fonction pour essayer de récupérer la connexion Supabase
 * @returns true si la connexion a été récupérée, false sinon
 */
export async function recoverSupabaseConnection(): Promise<boolean> {
  try {
    // 1. Essayer de rafraîchir la session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
    
    if (!data.session) {
      console.warn('Session refresh successful but no session returned');
      return false;
    }
    
    console.log('Session refreshed successfully');
    
    // 2. Vérifier si la connexion est maintenant fonctionnelle
    const isConnected = await checkSupabaseConnection();
    
    return isConnected;
  } catch (error) {
    console.error('Failed to recover Supabase connection:', error);
    return false;
  }
}