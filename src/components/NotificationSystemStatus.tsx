import React, { useState, useEffect } from 'react';
import { Clock, Mail, Users, AlertCircle, CheckCircle, RefreshCw, Settings, Calendar, Bell } from 'lucide-react';
import { 
  checkNotificationSystemHealth,
  testCronJobs,
  type DailyEmailStats 
} from '../services/cronManagement';

interface CronJobStatus {
  exists: boolean;
  active: boolean;
  schedule: string | null;
  nextRun: string | null;
}

interface NotificationSystemStatusProps {
  className?: string;
}

export function NotificationSystemStatus({ className = '' }: NotificationSystemStatusProps) {
  const [systemHealth, setSystemHealth] = useState<{
    cronJobs: {
      rfpSummary: CronJobStatus;
      prospectsSummary: CronJobStatus;
      clientNeedsSummary: CronJobStatus;
    };
    stats: DailyEmailStats[];
    isHealthy: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSystemHealth = async () => {
    try {
      setError(null);
      const health = await checkNotificationSystemHealth();
      setSystemHealth(health);
    } catch (err) {
      console.error('Error loading notification system health:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCronJobs = async () => {
    try {
      setIsTesting(true);
      setError(null);
      const result = await testCronJobs();
      setTestResult(result);
    } catch (err) {
      console.error('Error testing cron jobs:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du test');
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    loadSystemHealth();
    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (isHealthy: boolean, label: string) => (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      isHealthy 
        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
    }`}>
      {isHealthy ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
      {label}
    </span>
  );

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">Vérification du système...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* État général du système */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Système de notifications automatiques
          </h3>
          <div className="flex items-center gap-3">
            {systemHealth && getStatusBadge(systemHealth.isHealthy, systemHealth.isHealthy ? 'Opérationnel' : 'Problème')}
            <button
              onClick={loadSystemHealth}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          </div>
        )}

        {systemHealth && (
          <div className="space-y-4">
            {/* Configuration des tâches */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">AOs</h4>
                  {getStatusBadge(systemHealth.cronJobs.rfpSummary.exists && systemHealth.cronJobs.rfpSummary.active, 'Auto')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>📅 Tous les jours à 9h00</div>
                  <div>📊 {systemHealth.stats.reduce((sum, stat) => sum + stat.pending_rfps, 0)} AO(s) en attente</div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Références</h4>
                  {getStatusBadge(systemHealth.cronJobs.prospectsSummary.exists && systemHealth.cronJobs.prospectsSummary.active, 'Auto')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>📅 Tous les jours à 9h01</div>
                  <div>📊 {systemHealth.stats.reduce((sum, stat) => sum + stat.pending_prospects, 0)} prospect(s) en attente</div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Besoins Clients</h4>
                  {getStatusBadge(systemHealth.cronJobs.clientNeedsSummary.exists && systemHealth.cronJobs.clientNeedsSummary.active, 'Auto')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>📅 Tous les jours à 9h02</div>
                  <div>📊 {systemHealth.stats.reduce((sum, stat) => sum + stat.pending_client_needs, 0)} profil(s) en attente</div>
                </div>
              </div>
            </div>

            {/* Actions de test */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Tests et Maintenance</h4>
                <button
                  onClick={handleTestCronJobs}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  {isTesting ? 'Test en cours...' : 'Tester le système'}
                </button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg flex items-start gap-2 ${
                  testResult.success 
                    ? 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className={`text-sm ${
                    testResult.success 
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    <div className="font-medium">{testResult.message}</div>
                    <div className="text-xs opacity-75 mt-1">
                      Test effectué le {new Date(testResult.timestamp).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Statistiques détaillées par commercial */}
      {systemHealth?.stats && systemHealth.stats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Données à traiter par commercial
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commercial
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    AOs
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Références
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Besoins Clients
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email quotidien
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {systemHealth.stats.map((stat) => {
                  const totalPending = stat.pending_rfps + stat.pending_prospects + stat.pending_client_needs;
                  const willReceiveEmail = totalPending > 0;
                  
                  return (
                    <tr key={stat.sales_rep_code} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {stat.sales_rep_code} - {stat.sales_rep_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {stat.sales_rep_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          stat.pending_rfps > 0 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {stat.pending_rfps}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          stat.pending_prospects > 0 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {stat.pending_prospects}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          stat.pending_client_needs > 0 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {stat.pending_client_needs}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          willReceiveEmail 
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {willReceiveEmail ? '📧 Oui' : '⭕ Non'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Informations détaillées */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Comment ça fonctionne
        </h4>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <div>🕘 <strong>9h00</strong> : Récapitulatif des AOs en attente</div>
          <div>🕘 <strong>9h01</strong> : Récapitulatif des prises de références en attente</div>
          <div>🕘 <strong>9h02</strong> : Récapitulatif des profils pour besoins clients en attente</div>
          <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
            <strong>📧</strong> Les commerciaux ne reçoivent un email que s'ils ont des éléments à traiter.
          </div>
        </div>
      </div>

      {/* Résultat du test */}
      {testResult && (
        <div className={`p-4 rounded-lg flex items-start gap-2 ${
          testResult.success 
            ? 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {testResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className={`text-sm ${
            testResult.success 
              ? 'text-green-700 dark:text-green-300'
              : 'text-red-700 dark:text-red-300'
          }`}>
            <div className="font-medium">Test du système : {testResult.message}</div>
            <div className="text-xs opacity-75 mt-1">
              {new Date(testResult.timestamp).toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}