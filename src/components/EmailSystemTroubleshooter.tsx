import React, { useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Mail, Users, FileText, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TestResult {
  functionName: string;
  success: boolean;
  message: string;
  details?: any;
  emailsSent?: number;
}

export function EmailSystemTroubleshooter() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [overallResult, setOverallResult] = useState<{ success: boolean; message: string } | null>(null);

  const testDirectFunctionCall = async (functionName: string, testData: any = {}) => {
    try {
      console.log(`🧪 Testing function: ${functionName}`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: testData
      });
      
      if (error) {
        console.error(`❌ Function ${functionName} error:`, error);
        return {
          functionName,
          success: false,
          message: `Erreur : ${error.message}`,
          details: error
        };
      }
      
      if (!data) {
        return {
          functionName,
          success: false,
          message: 'Aucune donnée retournée',
          details: { response: data }
        };
      }
      
      console.log(`✅ Function ${functionName} response:`, data);
      
      return {
        functionName,
        success: data.success || false,
        message: data.message || 'Réponse reçue',
        details: data,
        emailsSent: data.emailsSent || 0
      };
    } catch (error) {
      console.error(`💥 Exception in ${functionName}:`, error);
      return {
        functionName,
        success: false,
        message: `Exception: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        details: error
      };
    }
  };

  const runComprehensiveTest = async () => {
    try {
      setIsRunning(true);
      setResults([]);
      setOverallResult(null);
      
      console.log('🚀 Starting comprehensive email system test...');
      
      const testResults: TestResult[] = [];
      
      // Test 1: Fonction de récapitulatif AOs (comme les notifications individuelles qui marchent)
      console.log('📋 Test 1: RFP Daily Summary');
      const rfpResult = await testDirectFunctionCall('send-daily-rfp-summary', { test: true });
      testResults.push(rfpResult);
      
      // Attendre 2 secondes entre les tests pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test 2: Fonction de récapitulatif Prospects  
      console.log('👥 Test 2: Prospects Daily Summary');
      const prospectsResult = await testDirectFunctionCall('send-daily-prospects-summary', { test: true });
      testResults.push(prospectsResult);
      
      // Attendre 2 secondes entre les tests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test 3: Fonction de récapitulatif Besoins Clients
      console.log('🎯 Test 3: Client Needs Daily Summary');  
      const clientNeedsResult = await testDirectFunctionCall('send-daily-client-needs-summary', { test: true });
      testResults.push(clientNeedsResult);
      
      // Calculer le résultat global
      const successCount = testResults.filter(r => r.success).length;
      const totalEmails = testResults.reduce((sum, r) => sum + (r.emailsSent || 0), 0);
      
      const overallSuccess = successCount === testResults.length;
      const message = overallSuccess 
        ? `✅ Tous les tests réussis ! ${totalEmails} email(s) envoyé(s) au total`
        : `❌ ${testResults.length - successCount} test(s) échoué(s) sur ${testResults.length}`;
      
      setResults(testResults);
      setOverallResult({ success: overallSuccess, message });
      
      console.log('🎯 Test summary:', { successCount, totalEmails, overallSuccess });
      
    } catch (error) {
      console.error('💥 Fatal error in comprehensive test:', error);
      setOverallResult({ 
        success: false, 
        message: `Erreur fatale: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getIcon = (functionName: string) => {
    if (functionName.includes('rfp')) return <FileText className="w-5 h-5" />;
    if (functionName.includes('prospect')) return <Users className="w-5 h-5" />;
    if (functionName.includes('client')) return <Target className="w-5 h-5" />;
    return <Mail className="w-5 h-5" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Mail className="w-6 h-6" />
          Test approfondi des récapitulatifs quotidiens
        </h2>
        <button
          onClick={runComprehensiveTest}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isRunning ? 'Test en cours...' : 'Tester les récapitulatifs'}
        </button>
      </div>

      {/* Résultat global */}
      {overallResult && (
        <div className={`mb-6 p-4 rounded-lg border ${
          overallResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-2">
            {overallResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className={`text-sm ${
              overallResult.success 
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              <div className="font-medium">{overallResult.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Résultats détaillés */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Résultats détaillés :</h3>
          
          {results.map((result, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {getIcon(result.functionName)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-medium ${
                      result.success 
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-red-900 dark:text-red-100'
                    }`}>
                      {result.functionName}
                    </h4>
                    {result.emailsSent !== undefined && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.emailsSent > 0
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {result.emailsSent} email(s)
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${
                    result.success 
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {result.message}
                  </p>
                  
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100">
                        Voir les détails techniques
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
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

      {/* Informations de debug */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
          💡 À savoir
        </h4>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <div>• Ce test appelle directement les fonctions Edge (même logique que les notifications qui marchent)</div>
          <div>• Les emails ne sont envoyés que si des commerciaux ont des éléments "À traiter"</div>
          <div>• Le flag `test: true` est ajouté pour éviter le spam en mode test</div>
        </div>
      </div>
    </div>
  );
}