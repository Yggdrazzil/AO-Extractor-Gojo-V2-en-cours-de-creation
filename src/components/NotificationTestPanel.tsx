import React, { useState } from 'react';
import { Mail, Send, AlertCircle, CheckCircle, RefreshCw, User, FileText, Target } from 'lucide-react';

export function NotificationTestPanel() {
  const [isTestingRFP, setIsTestingRFP] = useState(false);
  const [isTestingProspect, setIsTestingProspect] = useState(false);
  const [isTestingClientNeed, setIsTestingClientNeed] = useState(false);
  const [results, setResults] = useState<Array<{
    type: string;
    success: boolean;
    message: string;
    details?: any;
  }>>([]);

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

      // Appeler directement la fonction Edge
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

      if (error) {
        throw new Error(`Erreur fonction Edge: ${error.message}`);
      }

      if (!result?.success) {
        throw new Error(`Fonction Edge échouée: ${result?.message || 'Erreur inconnue'}`);
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
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Test des notifications individuelles
        </h3>
        {results.length > 0 && (
          <button
            onClick={clearResults}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Effacer les résultats
          </button>
        )}
      </div>

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

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
          💡 Comment utiliser ce panel
        </h4>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <div>🔧 Ces tests appellent directement les fonctions Edge (même logique que vos ajouts d'AO/prospects)</div>
          <div>📧 Ils envoient des emails de test à votre adresse personnelle</div>
          <div>🕐 Utilisez ceci pour diagnostiquer si les notifications individuelles fonctionnent</div>
        </div>
      </div>
    </div>
  );
}