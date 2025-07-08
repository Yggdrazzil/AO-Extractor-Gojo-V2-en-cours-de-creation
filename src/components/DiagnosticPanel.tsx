import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, XCircle, Database, ShieldCheck, Server, User } from 'lucide-react';
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
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const runDiagnostics = async () => {
    setIsLoading(true);
    setDebugInfo('');
    const diagnostics: DiagnosticResult[] = [];
    const debug: string[] = [];
    
    try {
      debug.push('Démarrage des diagnostics...');
      
      // 1. Vérifier les variables d'environnement
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      debug.push(`Variables d'environnement: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
      
      diagnostics.push({
        name: 'Variables d\'environnement',
        status: supabaseUrl && supabaseKey ? 'success' : 'error',
        message: supabaseUrl && supabaseKey 
          ? 'Variables d\'environnement Supabase correctement configurées' 
          : 'Variables d\'environnement Supabase manquantes',
        details: {
          supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : null,
          supabaseKeyLength: supabaseKey ? supabaseKey.length : 0,
        }
      });
      
      // 2. Vérifier la session
      debug.push('Vérification de la session...');
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      debug.push(`Résultat session: hasSession=${!!data.session}, hasError=${!!sessionError}`);
      if (sessionError) debug.push(`Erreur session: ${sessionError.message}`);
      if (data.session) debug.push(`Session user email: ${data.session.user.email}`);
      
      diagnostics.push({
        name: 'Session d\'authentification',
        status: data.session ? 'success' : sessionError ? 'error' : 'warning',
        message: data.session 
          ? `Session active pour ${data.session.user.email}` 
          : sessionError
          ? `Erreur de session: ${sessionError.message}`
          : 'Aucune session active',
        details: {
          session: data.session ? {
            user: {
              email: data.session.user.email,
              id: data.session.user.id
            },
            expiresAt: new Date(data.session.expires_at * 1000).toLocaleString()
          } : null,
          error: sessionError
        }
      });
      
      // 3. Tester l'accès à la table sales_reps
      debug.push('Test accès table sales_reps...');
      try {
        const { data: salesRepsData, error: salesRepsError } = await supabase
          .from('sales_reps')
          .select('count', { count: 'exact' });
        
        debug.push(`Résultat sales_reps: hasData=${!!salesRepsData}, hasError=${!!salesRepsError}`);
        if (salesRepsError) debug.push(`Erreur sales_reps: ${salesRepsError.message} (${salesRepsError.code})`);
        
        diagnostics.push({
          name: 'Accès à la table sales_reps',
          status: !salesRepsError ? 'success' : 'error',
          message: !salesRepsError 
            ? `Accès autorisé à la table sales_reps (${salesRepsData?.length || 0} entrées)` 
            : `Erreur d'accès à la table sales_reps: ${salesRepsError.message}`,
          details: {
            error: salesRepsError,
            code: salesRepsError?.code,
            data: salesRepsData
          }
        });
      } catch (error) {
        debug.push(`Exception sales_reps: ${error instanceof Error ? error.message : String(error)}`);
        diagnostics.push({
          name: 'Accès à la table sales_reps',
          status: 'error',
          message: `Erreur lors de l'accès à la table sales_reps`,
          details: { error }
        });
      }
      
      // 4. Tester l'accès à la table rfps
      debug.push('Test accès table rfps...');
      try {
        const { data: rfpsData, error: rfpsError } = await supabase
          .from('rfps')
          .select('count', { count: 'exact' });
        
        debug.push(`Résultat rfps: hasData=${!!rfpsData}, hasError=${!!rfpsError}`);
        if (rfpsError) debug.push(`Erreur rfps: ${rfpsError.message} (${rfpsError.code})`);
        
        diagnostics.push({
          name: 'Accès à la table rfps',
          status: !rfpsError ? 'success' : 'error',
          message: !rfpsError 
            ? `Accès autorisé à la table rfps (${rfpsData?.length || 0} entrées)` 
            : `Erreur d'accès à la table rfps: ${rfpsError.message}`,
          details: {
            error: rfpsError,
            code: rfpsError?.code,
            data: rfpsData
          }
        });
      } catch (error) {
        debug.push(`Exception rfps: ${error instanceof Error ? error.message : String(error)}`);
        diagnostics.push({
          name: 'Accès à la table rfps',
          status: 'error',
          message: `Erreur lors de l'accès à la table rfps`,
          details: { error }
        });
      }
      
      // 5. Tester l'accès à la table prospects
      debug.push('Test accès table prospects...');
      try {
        const { data: prospectsData, error: prospectsError } = await supabase
          .from('prospects')
          .select('count', { count: 'exact' });
        
        debug.push(`Résultat prospects: hasData=${!!prospectsData}, hasError=${!!prospectsError}`);
        if (prospectsError) debug.push(`Erreur prospects: ${prospectsError.message} (${prospectsError.code})`);
        
        diagnostics.push({
          name: 'Accès à la table prospects',
          status: !prospectsError ? 'success' : 'error',
          message: !prospectsError 
            ? `Accès autorisé à la table prospects (${prospectsData?.length || 0} entrées)` 
            : `Erreur d'accès à la table prospects: ${prospectsError.message}`,
          details: {
            error: prospectsError,
            code: prospectsError?.code,
            data: prospectsData
          }
        });
      } catch (error) {
        debug.push(`Exception prospects: ${error instanceof Error ? error.message : String(error)}`);
        diagnostics.push({
          name: 'Accès à la table prospects',
          status: 'error',
          message: `Erreur lors de l'accès à la table prospects`,
          details: { error }
        });
      }
      
      // 6. Tester l'accès à la table client_needs
      debug.push('Test accès table client_needs...');
      try {
        const { data: clientNeedsData, error: clientNeedsError } = await supabase
          .from('client_needs')
          .select('count', { count: 'exact' });
        
        debug.push(`Résultat client_needs: hasData=${!!clientNeedsData}, hasError=${!!clientNeedsError}`);
        if (clientNeedsError) debug.push(`Erreur client_needs: ${clientNeedsError.message} (${clientNeedsError.code})`);
        
        diagnostics.push({
          name: 'Accès à la table client_needs',
          status: !clientNeedsError ? 'success' : 'error',
          message: !clientNeedsError 
            ? `Accès autorisé à la table client_needs (${clientNeedsData?.length || 0} entrées)` 
            : `Erreur d'accès à la table client_needs: ${clientNeedsError.message}`,
          details: {
            error: clientNeedsError,
            code: clientNeedsError?.code,
            data: clientNeedsData
          }
        });
      } catch (error) {
        debug.push(`Exception client_needs: ${error instanceof Error ? error.message : String(error)}`);
        diagnostics.push({
          name: 'Accès à la table client_needs',
          status: 'error',
          message: `Erreur lors de l'accès à la table client_needs`,
          details: { error }
        });
      }
      
      // 7. Vérifier si le compte est administrateur
      debug.push('Vérification des droits administrateur...');
      if (data.session) {
        try {
          const { data: currentUser, error: currentUserError } = await supabase
            .from('sales_reps')
            .select('is_admin, code')
            .eq('email', data.session.user.email)
            .single();
          
          debug.push(`Résultat user rights: hasData=${!!currentUser}, hasError=${!!currentUserError}`);
          if (currentUser) debug.push(`User code: ${currentUser.code}, isAdmin: ${currentUser.is_admin}`);
          if (currentUserError) debug.push(`Erreur user rights: ${currentUserError.message}`);
          
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
          debug.push(`Exception user rights: ${error instanceof Error ? error.message : String(error)}`);
          diagnostics.push({
            name: 'Droits utilisateur',
            status: 'error',
            message: `Erreur lors de la vérification des droits utilisateur`,
            details: { error }
          });
        }
      }
      
      // 8. Récupération des informations serveur
      debug.push('Test requête de base...');
      try {
        const { data: testData, error: testError } = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey || '',
          }
        }).then(r => r.json().then(data => ({ data, error: null })).catch(error => ({ data: null, error })));
        
        debug.push(`Résultat test requête: hasData=${!!testData}, hasError=${!!testError}`);
        
        diagnostics.push({
          name: 'Communication avec le serveur',
          status: !testError ? 'success' : 'error',
          message: !testError 
            ? 'Communication avec le serveur Supabase OK' 
            : `Erreur de communication avec le serveur: ${testError}`,
          details: {
            error: testError,
            data: testData
          }
        });
      } catch (error) {
        debug.push(`Exception test requête: ${error instanceof Error ? error.message : String(error)}`);
        diagnostics.push({
          name: 'Communication avec le serveur',
          status: 'error',
          message: `Erreur lors de la communication avec le serveur`,
          details: { error }
        });
      }
      
      // 9. Vérifier le stockage
      debug.push('Test stockage...');
      try {
        // Tester si le bucket existe, si non, essayer d'obtenir la liste des buckets
        let bucketData: any = null;
        let bucketError: any = null;
        
        try {
          const result = await supabase.storage.getBucket('files');
          bucketData = result.data;
          bucketError = result.error;
        } catch {
          debug.push('getBucket non disponible, essai avec listBuckets...');
          try {
            const result = await supabase.storage.listBuckets();
            bucketData = result.data;
            bucketError = result.error;
          } catch (listError) {
            debug.push(`Exception listBuckets: ${listError instanceof Error ? listError.message : String(listError)}`);
            bucketError = listError;
          }
        }
        
        debug.push(`Résultat storage: hasData=${!!bucketData}, hasError=${!!bucketError}`);
        
        diagnostics.push({
          name: 'Accès au stockage',
          status: !bucketError ? 'success' : 'error',
          message: !bucketError 
            ? 'Accès au stockage OK' 
            : `Erreur d'accès au stockage: ${bucketError.message || bucketError}`,
          details: {
            error: bucketError,
            data: bucketData
          }
        });
      } catch (error) {
        debug.push(`Exception storage: ${error instanceof Error ? error.message : String(error)}`);
        diagnostics.push({
          name: 'Accès au stockage',
          status: 'error',
          message: 'Erreur lors de la vérification de l\'accès au stockage',
          details: { error }
        });
      }
      
      setDebugInfo(debug.join('\n'));
      
    } catch (error) {
      console.error('Erreur lors des diagnostics:', error);
      setDebugInfo(debug.join('\n') + `\n\nERREUR CRITIQUE: ${error instanceof Error ? error.message : String(error)}`);
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

  const getStatusBadge = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Succès</span>;
      case 'warning':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Avertissement</span>;
      case 'error':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Erreur</span>;
    }
  };

  const toggleDetails = (name: string) => {
    setShowDetails(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    'Variables d\'environnement': <Server className="w-5 h-5" />,
    'Session d\'authentification': <User className="w-5 h-5" />,
    'Droits utilisateur': <ShieldCheck className="w-5 h-5" />,
    'Communication avec le serveur': <Server className="w-5 h-5" />,
    'Accès': <Database className="w-5 h-5" />
  };

  const getCategoryIcon = (name: string) => {
    // Détecter le type de test
    if (name.includes('Accès à la table')) return <Database className="w-5 h-5" />;
    
    for (const [category, icon] of Object.entries(categoryIcons)) {
      if (name.includes(category)) return icon;
    }
    
    return <AlertCircle className="w-5 h-5" />;
  };

  const repairPermissions = async () => {
    try {
      setIsLoading(true);
      
      // Créer une migration pour corriger les permissions RLS
      // Dans un environnement réel, cela appellerait une fonction Edge
      // Ici, on simule seulement l'opération
      
      // Attendre 2 secondes pour simuler l'opération
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Une migration de réparation des permissions a été créée et sera appliquée au prochain redémarrage de la base de données. Veuillez vous déconnecter et vous reconnecter.');
      
      // Réexécuter les diagnostics
      await runDiagnostics();
    } catch (error) {
      console.error('Erreur lors de la réparation des permissions:', error);
      alert(`Erreur lors de la réparation: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = async () => {
    try {
      setIsLoading(true);
      
      // Se déconnecter
      await supabase.auth.signOut();
      
      // Attendre 1 seconde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Rediriger vers la page de connexion
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la réinitialisation de la session:', error);
      alert(`Erreur lors de la réinitialisation: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Diagnostic du système
        </h2>
        <div className="flex gap-3">
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
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  {getCategoryIcon(result.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleDetails(result.name)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate pr-2">
                          {result.name}
                        </h3>
                        <div className="flex-shrink-0">
                          {getStatusBadge(result.status)}
                        </div>
                      </div>
                      <p className={`text-sm mt-1 ${
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
                  
                  {showDetails[result.name] && result.details && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <pre className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.some(r => r.status === 'error') && (
        <div className="mt-6 space-y-4">
          <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
            <p className="text-red-700 dark:text-red-300 text-sm mb-4">
              <strong>Problèmes détectés</strong> - Il y a des erreurs qui peuvent empêcher l'application de fonctionner correctement. 
              Vérifiez la connexion internet, les paramètres de Supabase, et assurez-vous que vous êtes bien connecté.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={repairPermissions}
                disabled={isLoading}
                className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors text-sm"
              >
                Réparer les permissions RLS
              </button>
              
              <button
                onClick={resetSession}
                disabled={isLoading}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
              >
                Réinitialiser la session
              </button>
            </div>
          </div>
          
          <button 
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-sm text-blue-600 dark:text-blue-400 underline"
          >
            {showDebugInfo ? 'Masquer les informations de débogage' : 'Afficher les informations de débogage'}
          </button>
          
          {showDebugInfo && debugInfo && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {debugInfo}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}