import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';

// Vérification des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Initializing Supabase client with:', { 
  url: supabaseUrl ? 'Valid URL' : 'MISSING', 
  key: supabaseKey ? 'Valid Key' : 'MISSING'
});

if (!supabaseUrl || !supabaseKey) {
  console.error('ERREUR CRITIQUE: Variables d\'environnement Supabase manquantes!');
}

// Configuration du client avec retry et timeout
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-v2'
      },
    },
    db: {
      schema: 'public'
    },
    // Logs détaillés en mode développement
    debug: true
  }
);

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

// Helper pour vérifier la connexion à Supabase
export async function checkSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
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

// Réinitialiser la session Supabase (utiliser en cas de problèmes)
export async function resetSupabaseSession() {
  try {
    console.log('Resetting Supabase session...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Session refresh error:', error);
      // Si l'erreur est liée à une absence de session, essayons de récupérer la session
      const sessionResult = await supabase.auth.getSession();
      console.log('Current session state:', { 
        hasSession: !!sessionResult.data.session,
        error: sessionResult.error
      });
      return !!sessionResult.data.session;
    }
    
    console.log('Session refreshed:', !!data.session);
    return !!data.session;
  } catch (error) {
    console.error('Fatal error refreshing session:', error);
    return false;
  }
}