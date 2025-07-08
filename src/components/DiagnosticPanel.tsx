import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { supabase } from '../services/api/supabaseClient';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export function DiagnosticPanel() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  
  const runDiagnostics = async () => {
    setIsLoading(true);
    const diagnostics: DiagnosticResult[] = [];
    
    try {
      // 1. Vérifier les variables d'environnement
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      diagnostics.push({
        name: 'Variables d\'environnement',
        status: supabaseUrl && supabaseKey ? 'success' : 'error',
        message: supabaseUrl && supabaseKey 
          ? 'Variables d\'environnement Supabase correctement configurées' 
          : 'Variables d\'environnement Supabase manquantes',
        details: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
        }
      });
      
      // 2. Vérifier la session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      diagnostics.push({
        name: 'Session d\'authentification',
        status: sessionData.session ? 'success' : sessionError ? 'error' : 'warning',
        message: sessionData.session 
          ? `Session active pour ${sessionData.session.user.email}` 
          : sessionError
          ? `Erreur de session: ${sessionError.message}`
          : 'Aucune session active',
        details: {
          session: sessionData.session ? {
            user: {
              email: sessionData.session.user.email,
              id: sessionData.session.user.id
            },
            expiresAt: new Date(sessionData.session.expires_at * 1000).toLocaleString()
          } : null,
          error: sessionError
        }
      });
      
      // 3. Tester l'accès à la table sales_reps
      try {
        const { data: salesRepsData, error: salesRepsError } = await supabase
          .from('sales_reps')
          .select('count', { count: 'exact' });
        
        diagnostics.push({
          name: 'Accès à la table sales_reps',
          status: !salesRepsError ? 'success' : 'error',
          message: !salesRepsError 
            ? `Accès autorisé à la table sales_reps (${salesRepsData ? salesRepsData.length : 0} entrées)` 
            : `Erreur d'accès à la table sales_reps: ${salesRepsError.message}`,
          details: {
            error: salesRepsError,
            code: salesRepsError?.code,
            data: salesRepsData
          }
        });
      } catch (error) {
        diagnostics.push({
          name: 'Accès à la table sales_reps',
          status: 'error',
          message: `Erreur lors de l'accès à la table sales_reps`,
          details: { error }
        });
      }
      
      // 4. Tester l'accès à la table rfps
      try {
        const { data: rfpsData, error: rfpsError } = await supabase
          .from('rfps')
          .select('count', { count: 'exact' });
        
        diagnostics.push({
          name: 'Accès à la table rfps',
          status: !rfpsError ? 'success' : 'error',
          message: !rfpsError 
            ? `Accès autorisé à la table rfps (${rfpsData ? rfpsData.length : 0} entrées)` 
            : `Erreur d'accès à la table rfps: ${rfpsError.message}`,
          details: {
            error: rfpsError,
            code: rfpsError?.code,
            data: rfpsData
          }
        });
      } catch (error) {
        diagnostics.push({
          name: 'Accès à la table rfps',
          status: 'error',
          message: `Erreur lors de l'accès à la table rfps`,
          details: { error }
        });
      }
      
      // 5. Tester l'accès à la table prospects
      try {
        const { data: prospectsData, error: prospectsError } = await supabase
          .from('prospects')
          .select('count', { count: 'exact' });
        
        diagnostics.push({
          name: 'Accès à la table prospects',
          status: !prospectsError ? 'success' : 'error',
          message: !prospectsError 
            ? `Accès autorisé à la table prospects (${prospectsData ? prospectsData.length : 0} entrées)` 
            : `Erreur d'accès à la table prospects: ${prospectsError.message}`,
          details: {
            error: prospectsError,
            code: prospectsError?.code,
            data: prospectsData
          }
        });
      } catch (error) {
        diagnostics.push({
          name: 'Accès à la table prospects',
          status: 'error',
          message: `Erreur lors de l'accès à la table prospects`,
          details: { error }
        });
      }
      
      // 6. Vérifier si le compte est administrateur
      if (sessionData.session) {
        try {
          const { data: currentUser, error: currentUserError } = await supabase
            .from('sales_reps')
            .select('is_admin, code')
            .eq('email', sessionData.session.user.email)
            .single();
          
          diagnostics.push({
            name: 'Droits utilisateur',
            status: !currentUserError ? 'success' : 'error',
            message: !currentUserError 
              ? `Utilisateur identifié: ${currentUser.code} (${currentUser.is_admin ? 'Admin' : 'Non-admin'})` 
              : `Erreur d'identification utilisateur: ${currentUserError.message}`,
            details: {
              error: currentUserError,
              user: currentUser
            }
          });
        } catch (error) {
          diagnostics.push({
            name: 'Droits utilisateur',
            status: 'error',
            message: `Erreur lors de la vérification des droits utilisateur`,
            details: { error }
          });
        }
      }
      
      // 7. Vérifier la connexion aux fonctions Edge
      try {
        const { error: edgeFunctionError } = await supabase.functions.invoke('health-check', {
          method: 'GET'
        });
        
        diagnostics.push({
          name: 'Fonctions Edge',
          status: !edgeFunctionError ? 'success' : 'warning',
          message: !edgeFunctionError 
            ? 'Accès aux fonctions Edge OK' 
            : `Erreur d'accès aux fonctions Edge: ${edgeFunctionError.message}`,
          details: {
            error: edgeFunctionError
          }
        });
      } catch (error) {
        // Si la fonction n'existe pas, c'est normal (pas d'endpoint health-check)
        diagnostics.push({
          name: 'Fonctions Edge',
          status: 'warning',
          message: 'Fonction health-check non disponible',
          details: { error }
        });
      }
      
      // 8. Vérifier le stockage
      try {
        const { data: storageData, error: storageError } = await supabase.storage
          .getBucket('files');
        
        diagnostics.push({
          name: 'Accès au stockage',
          status: !storageError ? 'success' : 'error',
          message: !storageError 
            ? 'Accès au stockage OK' 
            : `Erreur d'accès au stockage: ${storageError.message}`,
          details: {
            error: storageError
          }
        });
      } catch (error) {
        diagnostics.push({
          name: 'Accès au stockage',
          status: 'error',
          message: 'Erreur lors de la vérification de l\'accès au stockage',
          details: { error }
        });
      }
      
    } catch (error) {
      console.error('Erreur lors des diagnostics:', error);
    } finally {
      setResults(diagnostics);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const toggleDetails = (name: string) => {
    setShowDetails(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Diagnostic du système
        </h2>
        <button
          onClick={runDiagnostics}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isLoading ? 'Exécution...' : 'Exécuter les tests'}
        </button>
      </div>

      {results.length === 0 && !isLoading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Aucun résultat disponible. Exécutez les tests de diagnostic.
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.name}
              className={`border rounded-lg p-4 ${
                result.status === 'success'
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  : result.status === 'warning'
                  ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
              }`}
            >
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleDetails(result.name)}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {result.name}
                    </h3>
                    <p className={`text-sm ${
                      result.status === 'success'
                        ? 'text-green-700 dark:text-green-300'
                        : result.status === 'warning'
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
                {result.details && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 underline">
                    {showDetails[result.name] ? 'Masquer les détails' : 'Afficher les détails'}
                  </span>
                )}
              </div>
              
              {showDetails[result.name] && result.details && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <pre className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {results.some(r => r.status === 'error') && (
        <div className="mt-6 p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
          <p className="text-red-700 dark:text-red-300 text-sm">
            <strong>Problèmes détectés</strong> - Il y a des erreurs qui peuvent empêcher l'application de fonctionner correctement. 
            Vérifiez la connexion internet, les paramètres de Supabase, et assurez-vous que vous êtes bien connecté.
          </p>
        </div>
      )}
    </div>
  );
}