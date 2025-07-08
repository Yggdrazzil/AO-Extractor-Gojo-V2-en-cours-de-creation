import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/database.types';
import { logError } from '../../utils/errorHandling';

// Vérification des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

// Configuration du client avec retry et timeout
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-v2'
      }
    },
    db: {
      schema: 'public'
    },
    // Ajout de la gestion des erreurs globale
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        // Ajouter un timeout pour éviter les requêtes bloquées
        signal: options?.signal || AbortSignal.timeout(30000) // 30 secondes
      }).catch(error => {
        logError(error, 'Supabase Fetch');
        throw error;
      });
    }
  }
);

/**
 * Helper pour vérifier la connexion à Supabase
 * @returns true si la connexion est établie, false sinon
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Test simple de connexion sans authentification
    const { data, error } = await supabase
      .from('sales_reps')
      .select('count', { count: 'exact', head: true });
    
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
 * Wrapper pour les requêtes Supabase avec gestion d'erreur
 * @param operation - Opération à effectuer
 * @returns Résultat de l'opération
 */
export async function safeSupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  try {
    const { data, error } = await operation();
    
    if (error) {
      console.error('Supabase operation error:', error);
      
      if (error.code === 'PGRST301') {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      } else if (error.code === '42501') {
        throw new Error('Permissions insuffisantes pour accéder aux données.');
      } else {
        throw new Error(error.message || 'Erreur lors de l\'opération');
      }
    }
    
    if (data === null) {
      throw new Error('Aucune donnée retournée');
    }
    
    return data as T;
  } catch (error) {
    console.error('Safe Supabase operation failed:', error);
    throw error;
  }
}