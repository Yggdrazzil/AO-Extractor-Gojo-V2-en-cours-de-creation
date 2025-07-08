import React, { createContext, useContext, useEffect, useState } from 'react';

// Constantes pour le stockage local
const STORAGE_KEYS = {
  THEME: 'theme',
  getUserSpecificKey: (key: string, email: string) => `${key}_${email}`
};

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
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : initialTheme;
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fonction pour changer le thème
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Sauvegarder le thème pour l'utilisateur spécifique
    if (userEmail) {
      localStorage.setItem(`theme_${userEmail}`, newTheme);
    }
    
    // Maintenir aussi le thème global pour la compatibilité
    localStorage.setItem('theme', newTheme);
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
      const { supabase } = await import('../services/api/supabaseClient');
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
        const { supabase } = await import('../services/api/supabaseClient');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user?.email) {
            setUserEmail(session.user.email);
            
            const userThemeKey = `theme_${session.user.email}`;
            const userTheme = localStorage.getItem(userThemeKey);
            
            if (userTheme && (userTheme === 'light' || userTheme === 'dark')) {
              setThemeState(userTheme as Theme);
            } else {
              setThemeState(initialTheme);
            }
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