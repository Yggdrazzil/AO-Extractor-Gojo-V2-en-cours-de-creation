import React, { useState } from 'react';
import { Mail, Send, AlertCircle, CheckCircle, RefreshCw, User, FileText, Target, Search, Bug } from 'lucide-react';

export function NotificationTestPanel() {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isTestingRFP, setIsTestingRFP] = useState(false);
  const [isTestingProspect, setIsTestingProspect] = useState(false);
  const [isTestingClientNeed, setIsTestingClientNeed] = useState(false);
  const [results, setResults] = useState<Array<{
    type: string;
    success: boolean;
    message: string;
    details?: any;
  }>>([]);

  const debugNotificationSystem = async () => {
    try {
      setIsDebugging(true);
      console.log('🔍 Starting deep debug of notification system...');
      
      const { supabase } = await import('../lib/supabase');
      
      // 1. Vérifier la session et les variables d'env
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        throw new Error('Utilisateur non connecté');
      }

      // 2. Récupérer les infos du commercial connecté
      const { data: salesRep } = await supabase
        .from('sales_reps')
        .select('id, code, email, name')
        .eq('email', session.user.email)
        .single();

      if (!salesRep) {
        throw new Error('Commercial non trouvé pour cet email');
      }

      console.log('👤 Current user:', salesRep);

      // 3. Tester directement la fonction send-daily-rfp-summary qui FONCTIONNE
      console.log('🧪 Testing working function (send-daily-rfp-summary)...');
      
      const { data: workingResult, error: workingError } = await supabase.functions.invoke('send-daily-rfp-summary', {
        body: { test: true }
      });

      console.log('📧 Working function result:', workingResult, 'Error:', workingError);

      // 4. Tester la fonction problématique send-rfp-notification
      console.log('🧪 Testing problematic function (send-rfp-notification)...');
      
      const { data: brokenResult, error: brokenError } = await supabase.functions.invoke('send-rfp-notification', {
        body: {
          rfpId: 'debug-test',
          client: 'Debug Client',
          mission: 'Debug Mission',
          location: 'Debug Location',
          salesRepCode: salesRep.code,
          assignedTo: salesRep.id
        }
      });

      console.log('❌ Broken function result:', brokenResult, 'Error:', brokenError);

      // 5. Comparer les résultats
      const debugData = {
        userInfo: {
          email: session.user.email,
          salesRep: salesRep
        },
        workingFunction: {
          name: 'send-daily-rfp-summary',
          result: workingResult,
          error: workingError,
          success: !workingError
        },
        brokenFunction: {
          name: 'send-rfp-notification',
          result: brokenResult,
          error: brokenError,
          success: !brokenError
        },
        comparison: {
          workingSuccess: !workingError,
          brokenSuccess: !brokenError,
          diagnosis: !brokenError ? 'Both functions work' : 'send-rfp-notification is broken'
        }
      };

      setDebugResults(debugData);
      
    } catch (error) {
      console.error('Debug failed:', error);
      setDebugResults({
        error: true,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const testRFPNotification = async () => {
    try {
      setIsTestingRFP(true);
      console.log('🧪 Testing RFP notification system...');
      
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer les infos du commercial connecté
      const { data: salesRep } = await supabase
        .from('sales_reps')
        .select('id, code, email')
        .eq('email', session.user.email)
        .single();

      if (!salesRep) {
        throw new Error('Commercial non trouvé pour cet email');
      }

      // Appeler directement la fonction Edge avec logs détaillés
      console.log('📤 Calling send-rfp-notification Edge Function with data:', {
        rfpId: 'test-rfp-notification',
        client: 'Client Test',
        mission: 'Test de notification AO',
        location: 'Test Location',
        salesRepCode: salesRep.code,
        assignedTo: salesRep.id
      });

      const { data: result, error } = await supabase.functions.invoke('send-rfp-notification', {
        body: {
          rfpId: 'test-rfp-notification',
          client: 'Client Test',
          mission: 'Test de notification AO',
          location: 'Test Location',
          salesRepCode: salesRep.code,
          assignedTo: salesRep.id
        }
      });

      console.log('📥 Edge Function response:', { result, error });

      if (error) {
        throw new Error(`Erreur fonction Edge: ${error.message}`);
      }

      if (!result?.success) {
        throw new Error(`Fonction Edge échouée: ${result?.error || result?.message || 'Erreur inconnue'}`);
      }

      setResults(prev => [...prev, {
        type: 'AO Notification',
        success: true,
        message: `Email envoyé à ${result.recipient} via ${result.provider}`,
        details: result
      }]);

    } catch (error) {
      console.error('RFP notification test failed:', error);
      setResults(prev => [...prev, {
        type: 'AO Notification',
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error
      }]);
    } finally {
      setIsTestingRFP(false);
    }
  };

  const testProspectNotification = async () => {
    try {
      setIsTestingProspect(true);
      console.log('🧪 Testing Prospect notification system...');
      
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer les infos du commercial connecté
      const { data: salesRep } = await supabase
        .from('sales_reps')
        .select('id, code, email')
        .eq('email', session.user.email)
        .single();

      if (!salesRep) {
        throw new Error('Commercial non trouvé pour cet email');
      }

      // Appeler directement la fonction Edge
      const { data: result, error } = await supabase.functions.invoke('send-prospect-notification', {
        body: {
          prospectId: 'test-prospect-notification',
          targetAccount: 'Compte Test',
          salesRepCode: salesRep.code,
          assignedTo: salesRep.id,
          hasCV: false
        }
      });

      if (error) {
        throw new Error(`Erreur fonction Edge: ${error.message}`);
      }

      if (!result?.success) {
        throw new Error(`Fonction Edge échouée: ${result?.message || 'Erreur inconnue'}`);
      }

      setResults(prev => [...prev, {
        type: 'Prospect Notification',
        success: true,
        message: `Email envoyé à ${result.recipient} via ${result.provider}`,
        details: result
      }]);

    } catch (error) {
      console.error('Prospect notification test failed:', error);
      setResults(prev => [...prev, {
        type: 'Prospect Notification',
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error
      }]);
    } finally {
      setIsTestingProspect(false);
    }
  };

  const testClientNeedNotification = async () => {
    try {
      setIsTestingClientNeed(true);
      console.log('🧪 Testing Client Need notification system...');
      
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer les infos du commercial connecté
      const { data: salesRep } = await supabase
        .from('sales_reps')
        .select('id, code, email')
        .eq('email', session.user.email)
        .single();

      if (!salesRep) {
        throw new Error('Commercial non trouvé pour cet email');
      }

      // Appeler directement la fonction Edge
      const { data: result, error } = await supabase.functions.invoke('send-client-need-notification', {
        body: {
          prospectId: 'test-client-need-notification',
          besoin: 'Besoin Test',
          salesRepCode: salesRep.code,
          assignedTo: salesRep.id,
          hasCV: false
        }
      });

      if (error) {
        throw new Error(`Erreur fonction Edge: ${error.message}`);
      }

      if (!result?.success) {
        throw new Error(`Fonction Edge échouée: ${result?.message || 'Erreur inconnue'}`);
      }

      setResults(prev => [...prev, {
        type: 'Client Need Notification',
        success: true,
        message: `Email envoyé à ${result.recipient} via ${result.provider}`,
        details: result
      }]);

    } catch (error) {
      console.error('Client need notification test failed:', error);
      setResults(prev => [...prev, {
        type: 'Client Need Notification',
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error
      }]);
    } finally {
      setIsTestingClientNeed(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setDebugResults(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Test et Debug des notifications individuelles
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={debugNotificationSystem}
            disabled={isDebugging}
            className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors text-sm"
          >
            {isDebugging ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Bug className="w-4 h-4" />
            )}
            {isDebugging ? 'Debug...' : 'Debug approfondi'}
          </button>
          {(results.length > 0 || debugResults) && (
            <button
              onClick={clearResults}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Debug Results */}
      {debugResults && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Diagnostic approfondi du système
          </h4>
          
          {debugResults.error ? (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
              Erreur de debug : {debugResults.message}
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-gray-600 rounded">
                  <h5 className="font-medium text-green-700 dark:text-green-300 mb-2">
                    ✅ Fonction qui marche (send-daily-rfp-summary)
                  </h5>
                  <div className="text-gray-700 dark:text-gray-300">
                    Success: {debugResults.workingFunction?.success ? 'Oui' : 'Non'}<br/>
                    Error: {debugResults.workingFunction?.error?.message || 'Aucune'}
                  </div>
                </div>
                
                <div className="p-3 bg-white dark:bg-gray-600 rounded">
                  <h5 className="font-medium text-red-700 dark:text-red-300 mb-2">
                    ❌ Fonction cassée (send-rfp-notification)
                  </h5>
                  <div className="text-gray-700 dark:text-gray-300">
                    Success: {debugResults.brokenFunction?.success ? 'Oui' : 'Non'}<br/>
                    Error: {debugResults.brokenFunction?.error?.message || 'Aucune'}
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  🔍 Diagnostic : {debugResults.comparison?.diagnosis}
                </h5>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugResults, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testRFPNotification}
          disabled={isTestingRFP}
          className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isTestingRFP ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
          {isTestingRFP ? 'Test en cours...' : 'Tester notification AO'}
        </button>

        <button
          onClick={testProspectNotification}
          disabled={isTestingProspect}
          className="flex items-center justify-center gap-2 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {isTestingProspect ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <User className="w-5 h-5" />
          )}
          {isTestingProspect ? 'Test en cours...' : 'Tester notification Prospect'}
        </button>

        <button
          onClick={testClientNeedNotification}
          disabled={isTestingClientNeed}
          className="flex items-center justify-center gap-2 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isTestingClientNeed ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Target className="w-5 h-5" />
          )}
          {isTestingClientNeed ? 'Test en cours...' : 'Tester notification Besoin Client'}
        </button>
      </div>

      {/* Résultats des tests */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Résultats des tests :</h4>
          {results.map((result, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className={`text-sm ${
                  result.success 
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  <div className="font-medium">{result.type}: {result.message}</div>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs opacity-75">Détails techniques</summary>
                      <pre className="mt-1 text-xs bg-black bg-opacity-10 p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
          🔍 Stratégie de diagnostic
        </h4>
        <div className="text-sm text-yellow-800 dark:text-yellow-300 space-y-2">
          <div>1️⃣ <strong>Debug approfondi</strong> : Compare les fonctions qui marchent vs celles cassées</div>
          <div>2️⃣ <strong>Test individuel</strong> : Teste chaque fonction Edge séparément</div>
          <div>3️⃣ <strong>Logs console</strong> : Vérifiez la console pour plus d'infos (F12 → Console)</div>
          <div>4️⃣ <strong>Point de comparaison</strong> : send-daily-rfp-summary FONCTIONNE, on va s'en inspirer</div>
        </div>
      </div>
    </div>
  );
}