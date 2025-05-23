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
      storage: localStorage
    },
    global: {
      fetch: (...args) => {
        return fetch(...args).catch(err => {
          console.error('Erreur de connexion Supabase:', err);
          throw new Error('Erreur de connexion à la base de données. Veuillez réessayer.');
        });
      }
    }
  }
);

// Helper pour vérifier la connexion
export async function checkSupabaseConnection() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No active session, connection check skipped');
      return true; // On retourne true car l'absence de session n'est pas une erreur
    }
    
    const { error } = await supabase.from('sales_reps').select('count', { count: 'exact' });
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Connection check failed, but may be due to auth state:', error);
    return false;
  }
}
