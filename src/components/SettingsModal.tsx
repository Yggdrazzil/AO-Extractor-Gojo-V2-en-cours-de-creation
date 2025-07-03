import React from 'react';
import { useState, useEffect } from 'react';
import { Sun, Moon, X, KeyRound, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { checkAdminRights } from '../services/auth';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  const [apiKey, setApiKey] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { theme, setTheme } = useTheme();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [boondmanagerConfig, setBoondmanagerConfig] = useState({
    baseUrl: '',
    apiKey: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email || null);
      
      // Charger la clé API spécifique à l'utilisateur
      if (session?.user?.email) {
        const userApiKey = localStorage.getItem(`openai-api-key_${session.user.email}`);
        setApiKey(userApiKey || '');
      }
      
      // Vérifier les droits admin
      const adminRights = await checkAdminRights();
      setIsAdmin(adminRights);
      
      // Charger la configuration Boondmanager spécifique à l'utilisateur
      if (session?.user?.email) {
        const userPrefix = `boondmanager_${session.user.email}_`;
        setBoondmanagerConfig({
          baseUrl: '', // Plus besoin de l'URL de base
          apiKey: localStorage.getItem(`${userPrefix}client-token`) || '',
          username: localStorage.getItem(`${userPrefix}client-key`) || '',
          password: localStorage.getItem(`${userPrefix}user-token`) || ''
        });
      }
    };
    getUserInfo();
  }, []);

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleUpdateApiKey = () => {
    if (userEmail) {
      // Sauvegarder la clé API pour cet utilisateur spécifique
      localStorage.setItem(`openai-api-key_${userEmail}`, apiKey);
      // Maintenir aussi la clé globale pour la compatibilité
      localStorage.setItem('openai-api-key', apiKey);
    }
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  const handleUpdateBoondmanagerConfig = () => {
    if (userEmail) {
      const userPrefix = `boondmanager_${userEmail}_`;
      localStorage.setItem(`${userPrefix}client-token`, boondmanagerConfig.apiKey);
      localStorage.setItem(`${userPrefix}client-key`, boondmanagerConfig.username);
      localStorage.setItem(`${userPrefix}user-token`, boondmanagerConfig.password);
      
      // Maintenir aussi les clés globales pour la compatibilité
      localStorage.setItem('boondmanager-client-token', boondmanagerConfig.apiKey);
      localStorage.setItem('boondmanager-client-key', boondmanagerConfig.username);
      localStorage.setItem('boondmanager-user-token', boondmanagerConfig.password);
    }
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
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

          {isAdmin && (
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
          )}

          <div>
            <h3 className="text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Configuration Boondmanager
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Token
                </label>
                <input
                  type="text"
                  value={boondmanagerConfig.apiKey}
                  onChange={(e) => setBoondmanagerConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Token client depuis l'interface administrateur > dashboard"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1651EE] focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client Key
                  </label>
                  <input
                    type="text"
                    value={boondmanagerConfig.username}
                    onChange={(e) => setBoondmanagerConfig(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Clé client depuis l'interface administrateur > dashboard"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1651EE] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User Token
                  </label>
                  <input
                    type="text"
                    value={boondmanagerConfig.password}
                    onChange={(e) => setBoondmanagerConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Token utilisateur depuis votre compte > paramètres > sécurité"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-[#1651EE] focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Client Token et Client Key :</strong> disponibles dans l'interface administrateur &gt; dashboard<br/>
                <strong>User Token :</strong> disponible dans votre interface utilisateur &gt; paramètres &gt; sécurité<br/>
                <em>Utilise la méthode X-Jwt-Client-BoondManager via proxy Supabase</em>
              </p>
              <button
                onClick={handleUpdateBoondmanagerConfig}
                className="w-full px-4 py-2 bg-[#1651EE] text-white rounded-lg hover:bg-[#1651EE]/90 transition-colors"
                disabled={showSuccess}
              >
                {showSuccess ? '✓ Configuration mise à jour' : 'Mettre à jour la configuration'}
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