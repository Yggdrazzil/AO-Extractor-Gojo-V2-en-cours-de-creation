import React from 'react';
import { useState, useEffect } from 'react';
import { Sun, Moon, X, KeyRound, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai-api-key') || '');
  const [showSuccess, setShowSuccess] = useState(false);
  const { theme, setTheme } = useTheme();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email || null);
    };
    getUserEmail();
  }, []);

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleUpdateApiKey = () => {
    localStorage.setItem('openai-api-key', apiKey);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.reload(); // Recharge la page pour réinitialiser l'état
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClickOutside}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
        <div className="flex items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">⚙️</span>
            <span className="text-gray-900 dark:text-gray-100">Paramètres</span>
          </h2>
          <button
            onClick={onClose}
            className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Connecté avec :</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {userEmail || 'Chargement...'}
            </span>
          </div>

          <div>
            <h3 className="text-gray-600 dark:text-gray-400 mb-3">Thème</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
                  theme === 'light'
                    ? 'bg-[#1651EE] text-white'
                    : 'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <Sun className="w-5 h-5" />
                Clair
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-[#1651EE] text-white'
                    : 'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <Moon className="w-5 h-5" />
                Sombre
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Configuration OpenAI
            </h3>
            <div className="space-y-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setShowSuccess(false);
                }}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1651EE] focus:border-transparent"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Votre clé API est stockée uniquement dans votre navigateur et n'est jamais partagée.
              </p>
              <button
                onClick={handleUpdateApiKey}
                className="w-full px-4 py-2 bg-[#1651EE] text-white rounded-lg hover:bg-[#1651EE]/90 transition-colors"
                disabled={showSuccess}
              >
                {showSuccess ? '✓ Clé mise à jour' : 'Mettre à jour la clé'}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}