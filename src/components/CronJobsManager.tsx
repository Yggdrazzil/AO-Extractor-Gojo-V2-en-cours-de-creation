import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, CheckCircle, XCircle, Play, Pause, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CronJob {
  jobid: number;
  schedule: string;
  command: string;
  active: boolean;
  jobname: string;
}

export function CronJobsManager() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadCronJobs = async () => {
    try {
      setError(null);
      console.log('Loading cron jobs via RPC...');
      
      // Essayer d'abord d'appeler la fonction RPC
      let cronJobs: CronJob[] = [];
      let hasRpcError = false;
      
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('list_all_cron_jobs');
        
        if (rpcError) {
          console.error('RPC error loading cron jobs:', rpcError);
          hasRpcError = true;
          
          // Si la fonction RPC n'existe pas, on indique qu'il faut appliquer la migration
          if (rpcError.message.includes('list_all_cron_jobs') || rpcError.code === '42883') {
            setError('⚠️ Migration non appliquée ! Vous devez appliquer la migration "setup_cron_jobs_system.sql" pour configurer les tâches automatiques.');
            setCronJobs([]);
            return;
          }
        } else {
          cronJobs = rpcData || [];
          console.log('Cron jobs loaded via RPC:', cronJobs);
        }
      } catch (err) {
        console.error('Exception calling RPC:', err);
        hasRpcError = true;
      }
      
      // Si l'appel RPC a échoué, simuler des données pour diagnostic
      if (hasRpcError) {
        console.log('RPC failed, showing diagnostic information...');
        setError('🚫 Les fonctions RPC pour les cron jobs ne sont pas disponibles. La migration "setup_cron_jobs_system.sql" doit être appliquée.');
        
        // Simuler des tâches pour expliquer ce qui devrait être configuré
        cronJobs = [
          {
            jobid: 0,
            schedule: '0 8 * * 1-5',
            command: 'Appel vers send-daily-rfp-summary',
            active: false,
            jobname: 'daily-rfp-summary'
          },
          {
            jobid: 0,
            schedule: '1 8 * * 1-5',
            command: 'Appel vers send-daily-prospects-summary',
            active: false,
            jobname: 'daily-prospects-summary'
          },
          {
            jobid: 0,
            schedule: '2 8 * * 1-5',
            command: 'Appel vers send-daily-client-needs-summary',
            active: false,
            jobname: 'daily-client-needs-summary'
          }
        ];
      }
      
      setCronJobs(cronJobs);
    } catch (err) {
      console.error('Failed to load cron jobs:', err);
      setError(`Erreur critique: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testManualTrigger = async (jobName: string) => {
    try {
      setActionLoading(jobName);
      console.log(`Testing manual trigger for: ${jobName}`);
      
      let functionName = '';
      switch (jobName) {
        case 'daily-rfp-summary':
          functionName = 'send-daily-rfp-summary';
          break;
        case 'daily-prospects-summary':
          functionName = 'send-daily-prospects-summary';
          break;
        case 'daily-client-needs-summary':
          functionName = 'send-daily-client-needs-summary';
          break;
        default:
          throw new Error(`Fonction inconnue pour ${jobName}`);
      }
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { manual_trigger: true }
      });
      
      if (error) {
        throw new Error(`Erreur lors du test: ${error.message}`);
      }
      
      if (data?.success) {
        alert(`✅ Test réussi ! ${data.emailsSent || 0} email(s) envoyé(s)`);
      } else {
        alert(`⚠️ Test terminé: ${data?.message || 'Aucun email à envoyer'}`);
      }
    } catch (err) {
      console.error('Manual trigger test failed:', err);
      alert(`❌ Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    loadCronJobs();
  }, []);

  const getJobDisplayName = (jobName: string) => {
    switch (jobName) {
      case 'daily-rfp-summary':
        return 'Récapitulatif AOs';
      case 'daily-prospects-summary':
        return 'Récapitulatif Prospects';
      case 'daily-client-needs-summary':
        return 'Récapitulatif Besoins Clients';
      default:
        return jobName;
    }
  };

  const getScheduleDescription = (schedule: string) => {
    switch (schedule) {
      case '0 8 * * 1-5':
        return '9h00 (lun-ven)';
      case '1 8 * * 1-5':
        return '9h01 (lun-ven)';
      case '2 8 * * 1-5':
        return '9h02 (lun-ven)';
      default:
        return schedule;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Gestionnaire des tâches automatiques
        </h3>
        <button
          onClick={loadCronJobs}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">Chargement des tâches...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {cronJobs.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Aucune tâche programmée
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Les tâches automatiques de récapitulatifs quotidiens ne sont pas encore configurées.
              </p>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div className="text-left">
                    <h5 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                      Migration requise
                    </h5>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                      Pour activer les envois automatiques du lundi au vendredi à 9h00, vous devez appliquer la migration suivante :
                    </p>
                    <code className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded text-xs font-mono text-yellow-800 dark:text-yellow-200">
                      setup_cron_jobs_system.sql
                    </code>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                  <strong>📧 En attendant :</strong> Vous pouvez utiliser les tests manuels ci-dessus pour déclencher les récapitulatifs à la demande.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-4">
                {cronJobs.map((job) => (
                  <div key={job.jobid} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {getJobDisplayName(job.jobname)}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          job.active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                        }`}>
                          {job.active ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Actif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactif
                            </>
                          )}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => testManualTrigger(job.jobname)}
                        disabled={actionLoading === job.jobname}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === job.jobname ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        Tester
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Horaire :</span>
                        <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                          {getScheduleDescription(job.schedule)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">ID :</span>
                        <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                          {job.jobid}
                        </span>
                      </div>
                    </div>
                    
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        Voir la commande SQL
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                        {job.command}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                  📅 Planning prévu après configuration
                </h4>
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <div>🗓️ <strong>Lundi à Vendredi uniquement</strong> (pas de week-end)</div>
                  <div>🕘 <strong>9h00</strong> → Récapitulatif AOs</div>
                  <div>🕘 <strong>9h01</strong> → Récapitulatif Prospects</div>
                  <div>🕘 <strong>9h02</strong> → Récapitulatif Besoins Clients</div>
                  <div>📧 Seuls les commerciaux avec des éléments "À traiter" reçoivent un email</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}