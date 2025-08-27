import React, { useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, XCircle, Mail, Send, Eye, EyeOff } from 'lucide-react';
import { runEmailSystemDiagnosis, testSimpleEmailSending, type EmailSystemDiagnosis } from '../services/emailDiagnostic';
import { supabase } from '../lib/supabase';

export function EmailDiagnosticPanel() {
  const [diagnosis, setDiagnosis] = useState<EmailSystemDiagnosis | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    // Récupérer l'email de l'utilisateur connecté
    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setCurrentUserEmail(session.user.email);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    getCurrentUser();
  }, []);

  const handleRunDiagnosis = async () => {
    setIsRunning(true);
    setTestResult(null);
    
    try {
      const result = await runEmailSystemDiagnosis();
      setDiagnosis(result);
    } catch (error) {
      console.error('Error running diagnosis:', error);
      setDiagnosis({
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString(),
        tests: [],
        summary: { total_tests: 0, success_count: 0, warning_count: 0, error_count: 1 }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestEmail = async () => {
    if (!currentUserEmail) {
      alert('Impossible de déterminer votre email pour le test');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await testSimpleEmailSending(currentUserEmail);
      setTestResult(result);
    } catch (error) {
      console.error('Error testing email:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors du test d\'email'
      });
    } finally {
      setIsTesting(false);
    }
  };

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

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
    }
  };

  const toggleDetails = (component: string) => {
    setShowDetails(prev => ({
      ...prev,
      [component]: !prev[component]
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Mail className="w-6 h-6" />
          Diagnostic du système d'emails
        </h2>
        <div className="flex items-center gap-3">
          {currentUserEmail && (
            <button
              onClick={handleTestEmail}
              disabled={isTesting}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isTesting ? 'Test en cours...' : 'Tester un envoi'}
            </button>
          )}
          <button
            onClick={handleRunDiagnosis}
            disabled={isRunning}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRunning ? 'Diagnostic...' : 'Lancer le diagnostic'}
          </button>
        </div>
      </div>

      {/* Résultat du test d'envoi */}
      {testResult && (
        <div className={`mb-6 p-4 border rounded-lg ${getStatusColor(testResult.success ? 'success' : 'error')}`}>
          <div className="flex items-start gap-2">
            {getStatusIcon(testResult.success ? 'success' : 'error')}
            <div>
              <h4 className="font-medium">Test d'envoi d'email</h4>
              <p className="text-sm mt-1">{testResult.message}</p>
              {testResult.messageId && (
                <p className="text-xs mt-1 opacity-75">ID du message : {testResult.messageId}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Résultats du diagnostic */}
      {diagnosis ? (
        <div className="space-y-4">
          {/* Résumé global */}
          <div className={`p-4 border rounded-lg ${getStatusColor(diagnosis.status)}`}>
            <div className="flex items-start gap-2">
              {getStatusIcon(diagnosis.status)}
              <div>
                <h3 className="font-medium">{diagnosis.message}</h3>
                <p className="text-sm mt-1">
                  {diagnosis.summary.success_count} succès, {diagnosis.summary.warning_count} avertissements, {diagnosis.summary.error_count} erreurs
                </p>
                <p className="text-xs mt-1 opacity-75">
                  Diagnostic effectué le {new Date(diagnosis.timestamp).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          {/* Détails des tests */}
          <div className="space-y-3">
            {diagnosis.tests.map((test, index) => (
              <div key={index} className={`border rounded-lg ${getStatusColor(test.status)}`}>
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => toggleDetails(test.component)}
                >
                  <div className="flex items-start gap-2">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{test.component}</h4>
                        <button className="p-1 hover:bg-black hover:bg-opacity-10 rounded">
                          {showDetails[test.component] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm mt-1">{test.message}</p>
                    </div>
                  </div>
                </div>
                
                {showDetails[test.component] && test.details && (
                  <div className="px-4 pb-4 border-t border-current border-opacity-20">
                    <pre className="text-xs mt-3 p-2 bg-black bg-opacity-10 rounded overflow-x-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Cliquez sur "Lancer le diagnostic" pour analyser le système d'emails
        </div>
      )}
    </div>
  );
}