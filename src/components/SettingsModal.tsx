import React from 'react';
import { useState, useEffect } from 'react';
import { Sun, Moon, X, KeyRound, LogOut, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { testEmailConfiguration } from '../services/email';

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
  const [emailTestStatus, setEmailTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

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

  const handleTestEmail = async () => {
    setEmailTestStatus('testing');
    try {
      const success = await testEmailConfiguration();
      setEmailTestStatus(success ? 'success' : 'error');
      setTimeout(() => setEmailTestStatus('idle'), 3000);
    } catch (error) {
      console.error('Email test error:', error);
      setEmailTestStatus('error');
      setTimeout(() => setEmailTestStatus('idle'), 3000);
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

          <div>
            <h3 className="text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Notifications Email
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Les commerciaux reçoivent automatiquement un email lors de l'attribution d'un nouvel AO.
              </p>
              <button
                onClick={handleTestEmail}
                disabled={emailTestStatus === 'testing'}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  emailTestStatus === 'success'
                    ? 'bg-green-500 text-white'
                    : emailTestStatus === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                {emailTestStatus === 'testing' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {emailTestStatus === 'success' && <CheckCircle className="w-4 h-4" />}
                {emailTestStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                {emailTestStatus === 'idle' && <Mail className="w-4 h-4" />}
                
                {emailTestStatus === 'testing' && 'Test en cours...'}
                {emailTestStatus === 'success' && 'Configuration OK'}
                {emailTestStatus === 'error' && 'Erreur de configuration'}
                {emailTestStatus === 'idle' && 'Tester la configuration'}
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