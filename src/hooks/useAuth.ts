import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/api/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import type { SalesRep } from '../types';

interface UseAuthReturn {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  salesRep: SalesRep | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer l'authentification
 */
export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fonction pour récupérer les informations du commercial
  const fetchSalesRepInfo = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('sales_reps')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error fetching sales rep info:', error);
        return null;
      }

      return data as SalesRep;
    } catch (error) {
      console.error('Failed to fetch sales rep info:', error);
      return null;
    }
  }, []);

  // Initialisation de l'état d'authentification
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer la session
        const { data, error: sessionError } = await supabase.auth.getSession();
        const session = data.session;
        
        if (sessionError) {
          throw sessionError;
        }

        setSession(session);
        setUser(session?.user || null);

        // Récupérer les informations du commercial si connecté
        if (session?.user?.email) {
          const repInfo = await fetchSalesRepInfo(session.user.email);
          setSalesRep(repInfo);
          setIsAdmin(repInfo?.is_admin || false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err.message : 'Erreur d\'authentification');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        setSession(session);
        setUser(session?.user || null);

        if (session?.user?.email) {
          const repInfo = await fetchSalesRepInfo(session.user.email);
          setSalesRep(repInfo);
          setIsAdmin(repInfo?.is_admin || false);
        } else {
          setSalesRep(null);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSalesRepInfo]);

  // Fonction de connexion
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      setSession(data.session);
      setUser(data.user);

      if (data.user?.email) {
        const repInfo = await fetchSalesRepInfo(data.user.email);
        setSalesRep(repInfo);
        setIsAdmin(repInfo?.is_admin || false);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      setSalesRep(null);
      setIsAdmin(false);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Erreur de déconnexion');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    user,
    loading,
    error,
    salesRep,
    isAdmin,
    signIn,
    signOut
  };
}