import React, { createContext, useContext, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, initialTheme = 'light' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Essayer de récupérer le thème du localStorage
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : initialTheme;
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fonction pour changer le thème
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Sauvegarder le thème pour l'utilisateur spécifique
    if (userEmail) {
      localStorage.setItem(
        STORAGE_KEYS.getUserSpecificKey(STORAGE_KEYS.THEME, userEmail),
        newTheme
      );
    }
    
    // Maintenir aussi le thème global pour la compatibilité
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Fonction pour charger les paramètres utilisateur
  const loadUserSettings = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        
        // Charger le thème spécifique à l'utilisateur
        const userTheme = localStorage.getItem(`theme_${session.user.email}`);
        if (userTheme && (userTheme === 'light' || userTheme === 'dark')) {
          setTheme(userTheme as Theme);
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  // Charger les paramètres au montage du composant
  useEffect(() => {
    loadUserSettings();
  }, []);

  // Écouter les changements d'authentification
  useEffect(() => {
    const setupAuthListener = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user?.email) {
            setUserEmail(session.user.email);
            
            const userThemeKey = STORAGE_KEYS.getUserSpecificKey(STORAGE_KEYS.THEME, session.user.email);
            const userTheme = localStorage.getItem(userThemeKey);
            
            if (userTheme === 'light' || userTheme === 'dark') {
              setThemeState(userTheme);
            }

            const userThemeKey = STORAGE_KEYS.getUserSpecificKey(STORAGE_KEYS.THEME, session.user.email);
            const userTheme = localStorage.getItem(userThemeKey);
          
            setThemeState(initialTheme);
          }
        });
        
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error setting up auth listener:', error);
      }
    };
    
    setupAuthListener();
  }, [initialTheme]);

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