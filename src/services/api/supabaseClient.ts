import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';

// Vérification des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

// Helper pour les opérations sécurisées avec Supabase
export async function safeSupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await operation();
  
  if (error) {
    console.error('Supabase operation error:', error);
    throw error;
  }
  
  if (data === null) {
    throw new Error('Aucune donnée retournée par l\'opération');
  }
  
  return data;
}

// Configuration du client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage
    }
  }
);

/**
 * Helper pour vérifier la connexion à Supabase
 * @returns true si la connexion est établie, false sinon
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Test simple de connexion
    console.log('Testing Supabase connection with URL:', supabaseUrl);
    const { error } = await supabase.from('sales_reps').select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error);
      // Si c'est une erreur d'autorisation, la connexion fonctionne mais l'utilisateur n'est pas connecté
      if (error.code === 'PGRST301' || error.code === '42501') {
        console.log('Connection OK, but authentication required');
        return true;
      }
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.warn('Connection check failed:', error);
    return false;
  }
}

/**
 * Réinitialise la session Supabase
 * À utiliser en cas de problèmes de connexion
 */
export async function resetSupabaseSession(): Promise<boolean> {
  try {
    // Forcer le rechargement de la session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
    
    console.log('Session refreshed successfully:', !!data.session);
    return !!data.session;
  } catch (error) {
    console.error('Session refresh failed:', error);
    return false;
  }
}