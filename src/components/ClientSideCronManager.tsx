import React, { useState, useEffect } from 'react';
import { Clock, Power, PowerOff, CheckCircle, AlertCircle, Bell, RefreshCw, Zap, Calendar } from 'lucide-react';
import { 
  initializeClientSideCron, 
  checkCronStatus, 
  toggleCronTasks, 
  getLastExecutionResult, 
  requestNotificationPermission 
} from '../services/clientSideCron';

export function ClientSideCronManager() {
  const [cronStatus, setCronStatus] = useState<{
    enabled: boolean;
    nextExecutionTime: string;
    workingDays: string;
    lastExecution: string | null;
    serviceWorkerActive: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastExecution, setLastExecution] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState(false);

  const loadStatus = async () => {
    try {
      const status = await checkCronStatus();
      setCronStatus(status);
      
      const lastResult = getLastExecutionResult();
      setLastExecution(lastResult);
      
      // Vérifier les permissions de notification
      const hasPermission = 'Notification' in window && Notification.permission === 'granted';
      setNotificationPermission(hasPermission);
    } catch (error) {
      console.error('Error loading cron status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialize = async () => {
    try {
      setIsInitializing(true);
      const success = await initializeClientSideCron();
      
      if (success) {
        await loadStatus();
        alert('✅ Système automatique initialisé ! Les récapitulatifs seront envoyés du lundi au vendredi à 9h00.');
      } else {
        alert('❌ Erreur lors de l\'initialisation du système automatique.');
      }
    } catch (error) {
      console.error('Error initializing cron:', error);
      alert('❌ Erreur lors de l\'initialisation.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleToggle = async () => {
    if (!cronStatus) return;
    
    try {
      const newState = !cronStatus.enabled;
      const success = await toggleCronTasks(newState);
      
      if (success) {
        setCronStatus(prev => prev ? { ...prev, enabled: newState } : null);
        alert(newState ? '✅ Tâches automatiques activées !' : '⏸️ Tâches automatiques désactivées.');
      } else {
        alert('❌ Erreur lors du changement d\'état.');
      }
    } catch (error) {
      console.error('Error toggling cron:', error);
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted);
    
    if (granted) {
      alert('✅ Notifications autorisées ! Vous serez informé quand les emails sont envoyés.');
    } else {
      alert('❌ Notifications refusées. Vous pouvez les activer dans les paramètres du navigateur.');
    }
  };

  useEffect(() => {
    loadStatus();
    
    // Actualiser le statut toutes les 30 secondes
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Système automatique intelligent (côté navigateur)
        </h3>
        <button
          onClick={loadStatus}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Bannière explicative */}
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              🎯 Solution intelligente côté navigateur
            </h4>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Ce système utilise la technologie **Service Worker** pour programmer l'envoi automatique des récapitulatifs 
              directement depuis votre navigateur, contournant les limitations de Supabase hébergé.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">Vérification du système...</span>
        </div>
      ) : !cronStatus?.serviceWorkerActive ? (
        <div className="text-center py-8 space-y-4">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Système automatique non configuré
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Le système d'envoi automatique doit être initialisé pour fonctionner.
          </p>
          <button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isInitializing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Initialisation...
              </>
            ) : (
              <>
                <Power className="w-5 h-5" />
                Activer le système automatique
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statut principal */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <div className={`text-2xl font-bold mb-2 ${cronStatus.enabled ? 'text-green-600' : 'text-red-600'}`}>
                {cronStatus.enabled ? '🟢' : '🔴'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {cronStatus.enabled ? 'Actif' : 'Inactif'}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                9h00
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Heure française
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                Lun-Ven
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Jours ouvrés
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                ⚡
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Service Worker
              </div>
            </div>
          </div>

          {/* Contrôles */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                Envois automatiques du lundi au vendredi
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Les récapitulatifs seront envoyés chaque matin à 9h00 (heure française)
              </p>
            </div>
            <button
              onClick={handleToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                cronStatus.enabled
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {cronStatus.enabled ? (
                <>
                  <PowerOff className="w-4 h-4" />
                  Désactiver
                </>
              ) : (
                <>
                  <Power className="w-4 h-4" />
                  Activer
                </>
              )}
            </button>
          </div>

          {/* Notifications */}
          {cronStatus.enabled && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">
                      Notifications d'exécution
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Soyez notifié quand les emails sont envoyés automatiquement
                    </p>
                  </div>
                </div>
                {!notificationPermission ? (
                  <button
                    onClick={handleRequestNotifications}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Activer
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Activées</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dernière exécution */}
          {lastExecution && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Dernière exécution automatique
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Date :</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {new Date(lastExecution.timestamp).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Emails envoyés :</span>
                  <span className="ml-2 font-bold text-green-600 dark:text-green-400">
                    {lastExecution.totalEmails}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 space-y-2">
                {lastExecution.results.map((result: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{result.type}</span>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                        {result.emailsSent || 0} email(s)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informations techniques */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              📋 Comment ça fonctionne
            </h4>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <div>🤖 **Service Worker** : Fonctionne en arrière-plan dans votre navigateur</div>
              <div>⏰ **Vérification** : Toutes les heures pour détecter 9h00</div>
              <div>📅 **Planning** : Lundi à vendredi uniquement (pas de week-end)</div>
              <div>📧 **Appel direct** : Utilise les mêmes fonctions Edge que les tests manuels</div>
              <div>💾 **Persistant** : Continue à fonctionner même si vous fermez l'onglet</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}