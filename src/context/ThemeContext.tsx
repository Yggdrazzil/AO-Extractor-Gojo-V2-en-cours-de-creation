import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Thème par défaut, sera mis à jour après la connexion
    return 'light';
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Sauvegarder le thème pour l'utilisateur spécifique
    if (userEmail) {
      localStorage.setItem(`theme_${userEmail}`, theme);
    }
    // Maintenir aussi le thème global pour la compatibilité
    localStorage.setItem('theme', theme);
    
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
            
            // Charger le thème spécifique à l'utilisateur
            const userTheme = localStorage.getItem(`theme_${session.user.email}`);
            if (userTheme && (userTheme === 'light' || userTheme === 'dark')) {
              setTheme(userTheme as Theme);
            }
          } else if (event === 'SIGNED_OUT') {
            setUserEmail(null);
            // Revenir au thème par défaut
            setTheme('light');
          }
        });
        
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error setting up auth listener:', error);
      }
    };
    
    setupAuthListener();
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