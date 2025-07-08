import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/api/supabaseClient';

type Theme = 'light' | 'dark';

// Structure du contexte de thème
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Props pour le fournisseur de thème
interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Clés pour le localStorage
const THEME_KEY = 'theme';
const getThemeKey = (email: string) => `theme_${email}`;

export function ThemeProvider({ children, initialTheme = 'light' }: ThemeProviderProps) {
  // État initial du thème
  const [theme, setThemeState] = useState<Theme>(() => {
    // Essayer de récupérer le thème du localStorage
    const savedTheme = localStorage.getItem(THEME_KEY);
    return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : initialTheme;
  });
  
  // Email de l'utilisateur pour les préférences spécifiques
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fonction pour changer le thème
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Sauvegarder le thème global
    localStorage.setItem(THEME_KEY, newTheme);
    
    // Sauvegarder le thème pour l'utilisateur spécifique si connecté
    if (userEmail) {
      localStorage.setItem(getThemeKey(userEmail), newTheme);
    }
  };

  // Appliquer le thème au document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Charger les paramètres utilisateur à la connexion
  useEffect(() => {
    async function loadUserTheme() {
      try {
        // Récupérer la session active
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        
        if (session?.user?.email) {
          setUserEmail(session.user.email);
          
          // Récupérer le thème spécifique à l'utilisateur
          const userThemeKey = getThemeKey(session.user.email);
          const userTheme = localStorage.getItem(userThemeKey);
          
          if (userTheme && (userTheme === 'light' || userTheme === 'dark')) {
            setThemeState(userTheme as Theme);
          }
        }
      } catch (error) {
        console.error('Error loading user theme:', error);
      }
    }
    
    loadUserTheme();
  }, []);

  // Écouter les changements d'authentification
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        setUserEmail(session.user.email);
        
        // Charger le thème spécifique à l'utilisateur
        const userThemeKey = getThemeKey(session.user.email);
        const userTheme = localStorage.getItem(userThemeKey);
        
        if (userTheme && (userTheme === 'light' || userTheme === 'dark')) {
          setThemeState(userTheme as Theme);
        }
      } else if (event === 'SIGNED_OUT') {
        setUserEmail(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}