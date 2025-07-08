import React, { useState } from 'react';
import { supabase } from '../services/api/supabaseClient';
import { LoadingSpinner } from './common/LoadingSpinner';

// Messages d'erreur personnalisés pour une meilleure expérience utilisateur
const ERROR_MESSAGES = {
  'Invalid login credentials': 'Identifiants invalides. Veuillez réessayer.',
  'Email not confirmed': 'Votre email n\'a pas été confirmé. Vérifiez votre boîte de réception.',
  'Invalid email': 'Format d\'email invalide.',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  'JWT expired': 'Session expirée. Veuillez vous reconnecter.',
  'Network error': 'Problème de connexion. Vérifiez votre connexion internet.',
};

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setLoginError(null);
      
      console.log("Tentative de connexion avec email:", email);
      
      // Vérifier la connexion à Supabase avant de tenter la connexion
      try {
        const { error: pingError } = await supabase.from('sales_reps').select('id', { head: true, count: 'exact' });
        
        if (pingError) {
          console.warn('Supabase connection test failed:', pingError);
          // On continue car l'erreur peut être liée à l'authentification
        } else {
          console.log('Supabase connection test successful');
        }
      } catch (pingError) {
        console.error('Supabase ping error:', pingError);
        setLoginError('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
        return;
      }
      
      // Tentative de connexion
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
    
      if (error) throw error;
      
      console.log("Résultat de connexion:", { 
        success: !!data.session, 
        user: data.user?.email
      });
      
      if (data.session) {
        console.log("Connexion réussie, session:", data.session.user.id);
        
        // Vérifier que l'utilisateur existe dans la table sales_reps
        const { data: salesRep, error: salesRepError } = await supabase
          .from('sales_reps')
          .select('id, name, code')
          .eq('email', email)
          .single();
          
        if (salesRepError) {
          console.warn('User not found in sales_reps table:', salesRepError);
          // On continue quand même - l'utilisateur peut être authentifié sans être un commercial
        } else {
          console.log('Sales rep found:', salesRep);
        }
        
        // Appeler le callback de succès
        onLoginSuccess();
      } else {
        throw new Error("Aucune session créée après connexion");
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Formatter le message d'erreur pour l'utilisateur
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        // Utiliser un message personnalisé s'il existe
        for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
          if (errorMessage.includes(key)) {
            setLoginError(message);
            return;
          }
        }
        
        // Message par défaut si aucun message personnalisé ne correspond
        setLoginError(errorMessage);
      } else {
        setLoginError("Une erreur inattendue est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#1651EE] rounded-full mx-auto flex items-center justify-center">
            <span className="text-white text-2xl font-bold">G</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">GOJO Platform</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Connectez-vous pour accéder à l'application</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#1651EE] focus:border-[#1651EE]"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#1651EE] focus:border-[#1651EE]"
            />
          </div>
          
          {loginError && (
            <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/20 rounded-md">
              {loginError}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full px-4 py-2 bg-[#1651EE] text-white rounded-lg hover:bg-[#1651EE]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Connexion...</span>
              </div>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>
        
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
          En cas de problème de connexion, contactez votre administrateur
        </div>
      </div>
    </div>
  );
}