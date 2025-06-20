import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

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
    }
  }
);

// Helper pour vérifier la connexion
export async function checkSupabaseConnection() {
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