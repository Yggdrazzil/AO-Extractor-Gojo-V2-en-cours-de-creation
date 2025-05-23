import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface LoginFormProps {
  onLoginSuccess: (session: Session) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    
    try {
      setLoginError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
    
      if (error) throw error;
      if (data.session) onLoginSuccess(data.session);
    } catch (error) {
      setLoginError("Identifiants invalides. Veuillez réessayer.");
      console.error('Login error:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Connexion requise</h1>
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
              name="email"
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
              name="password"
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
            className="w-full px-4 py-2 bg-[#1651EE] text-white rounded-lg hover:bg-[#1651EE]/90 transition-colors"
          >
            Se connecter
          </button>
        </form>
      </div>
  );
}