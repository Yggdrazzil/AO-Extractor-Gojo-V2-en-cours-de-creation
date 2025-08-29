import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, CheckCircle, XCircle, Play, Pause, AlertTriangle, Info, ExternalLink } from 'lucide-react';
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
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const loadCronJobs = async () => {
    try {
      setError(null);
      console.log('🔍 Investigating cron job capabilities...');
      
      // Étape 1: Diagnostic du système
      try {
        console.log('🧪 Running system diagnosis...');
        const { data: diagData, error: diagError } = await supabase.rpc('diagnose_cron_capabilities');
        
        if (!diagError && diagData) {
          setDiagnosticInfo(diagData);
          console.log('📋 Diagnostic results:', diagData);
        }
      } catch (diagError) {
        console.error('❌ Could not run diagnosis:', diagError);
      }
      
      // Étape 2: Essayer de lister les cron jobs
      try {
        console.log('📝 Attempting to list cron jobs...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('list_all_cron_jobs');
        
        if (rpcError) {
          console.error('❌ RPC error listing cron jobs:', rpcError);
          
          if (rpcError.code === '42883' || rpcError.message.includes('list_all_cron_jobs')) {
            throw new Error('FUNCTION_NOT_EXISTS');
          } else if (rpcError.code === '42501') {
            throw new Error('PERMISSION_DENIED');
          } else {
            throw new Error(`DATABASE_ERROR: ${rpcError.message}`);
          }
        }
        
        const cronJobs = rpcData || [];
        console.log('✅ Cron jobs loaded successfully:', cronJobs);
        
        // Vérifier le type de résultats
        if (cronJobs.length > 0) {
          const firstJob = cronJobs[0];
          
          if (firstJob.jobname === 'cron_system_unavailable') {
            throw new Error('CRON_UNAVAILABLE');
          } else if (firstJob.jobname === 'error_listing_jobs') {
            throw new Error(`LISTING_ERROR: ${firstJob.command}`);
          }
        }
        
        setCronJobs(cronJobs);
        
      } catch (err) {
        console.error('💥 Exception listing cron jobs:', err);
        
        if (err.message === 'FUNCTION_NOT_EXISTS') {
          setError('⚠️ **Migration non appliquée** ! La migration `setup_cron_jobs_system.sql` doit être appliquée pour configurer les tâches automatiques.');
          setShowAlternatives(true);
        } else if (err.message === 'CRON_UNAVAILABLE') {
          setError('🚫 **Supabase hébergé** : L\'extension `pg_cron` n\'est pas disponible sur cette instance. Les cron jobs automatiques ne peuvent pas être configurés.');
          setShowAlternatives(true);
        } else if (err.message === 'PERMISSION_DENIED') {
          setError('🔒 **Permissions insuffisantes** : Vous n\'avez pas les droits pour configurer des cron jobs sur cette base de données.');
          setShowAlternatives(true);
        } else if (err.message.startsWith('LISTING_ERROR')) {
          setError(`❌ **Erreur de listing** : ${err.message.replace('LISTING_ERROR: ', '')}`);
        } else {
          setError(`❌ **Erreur inattendue** : ${err.message}`);
        }
        
        // Montrer des cron jobs simulés pour référence
        setCronJobs([
          {
            jobid: 0,
            schedule: '0 8 * * 1-5',
            command: 'SELECT net.http_post(...) // Récapitulatif AOs',
            active: false,
            jobname: 'daily-rfp-summary'
          },
          {
            jobid: 0, 
            schedule: '1 8 * * 1-5',
            command: 'SELECT net.http_post(...) // Récapitulatif Prospects',
            active: false,
            jobname: 'daily-prospects-summary'
          },
          {
            jobid: 0,
            schedule: '2 8 * * 1-5', 
            command: 'SELECT net.http_post(...) // Récapitulatif Besoins Clients',
            active: false,
            jobname: 'daily-client-needs-summary'
          }
        ]);
      }
    } catch (err) {
      console.error('💥 Critical error loading cron jobs:', err);
      setError(`❌ Erreur critique : ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
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
        return 'Lun-Ven 9h00';
      case '1 8 * * 1-5':
        return 'Lun-Ven 9h01';
      case '2 8 * * 1-5':
        return 'Lun-Ven 9h02';
      case 'ERROR':
        return 'Erreur';
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

      {/* Informations de diagnostic */}
      {diagnosticInfo && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Diagnostic du système
          </h4>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <div>📋 Extension pg_cron : {diagnosticInfo.pg_cron_available ? '✅ Disponible' : '❌ Non disponible'}</div>
            <div>🔒 Permissions cron : {diagnosticInfo.can_create_cron ? '✅ OK' : '❌ Insuffisantes'}</div>
            <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-800 rounded text-xs">
              💡 {diagnosticInfo.recommendations}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
              Problème détecté avec le système automatique
            </div>
          </div>
          <div className="text-yellow-700 dark:text-yellow-300 text-sm mb-4">
            {error}
          </div>
          
          {showAlternatives && (
            <div className="space-y-3">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="text-yellow-700 dark:text-yellow-300 text-sm underline hover:no-underline"
              >
                {showAlternatives ? 'Masquer les alternatives' : 'Voir les alternatives'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Solutions alternatives */}
      {showAlternatives && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            🔧 Solutions alternatives
          </h4>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500">
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                1️⃣ Tests manuels (recommandé)
              </h5>
              <p className="text-gray-600 dark:text-gray-400">
                Utilisez les boutons "Tester" ci-dessus pour déclencher les récapitulatifs à la demande. 
                Fonctionne parfaitement pour un usage quotidien.
              </p>
            </div>
            
            <div className="p-3 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500">
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1">
                2️⃣ GitHub Actions <ExternalLink className="w-3 h-3" />
              </h5>
              <p className="text-gray-600 dark:text-gray-400">
                Configurer une action GitHub qui appelle les fonctions Edge tous les matins à 9h00 (lun-ven).
              </p>
            </div>
            
            <div className="p-3 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500">
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1">
                3️⃣ Vercel Cron Jobs <ExternalLink className="w-3 h-3" />
              </h5>
              <p className="text-gray-600 dark:text-gray-400">
                Utiliser Vercel Cron pour programmer les appels automatiques aux fonctions Edge.
              </p>
            </div>
            
            <div className="p-3 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500">
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                4️⃣ Supabase Pro/Team
              </h5>
              <p className="text-gray-600 dark:text-gray-400">
                Passer à un plan Supabase supérieur pourrait donner accès à l'extension pg_cron.
              </p>
            </div>
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
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="text-left">
                    <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                      Configuration requise
                    </h5>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                      Pour activer les envois automatiques **du lundi au vendredi** à 9h00, appliquez d'abord cette migration de diagnostic :
                    </p>
                    <code className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded text-xs font-mono text-blue-800 dark:text-blue-200">
                      check_cron_capabilities.sql
                    </code>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-300 text-sm">
                  <strong>📧 Solution immédiate :</strong> Utilisez les "Tests approfondi des récapitulatifs" dans la section "Outils" pour déclencher les envois manuellement.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Statut global */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {cronJobs.filter(job => job.active).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tâches actives</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Lun-Ven
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Planning</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    9h00
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Heure française</div>
                </div>
              </div>
              
              {/* Liste des tâches */}
              <div className="grid grid-cols-1 gap-3">
                {cronJobs.map((job) => (
                  <div key={`${job.jobname}-${job.jobid}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {getJobDisplayName(job.jobname)}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          job.active && job.jobid > 0
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                        }`}>
                          {job.active && job.jobid > 0 ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Actif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              {job.jobid === 0 ? 'Non configuré' : 'Inactif'}
                            </>
                          )}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => testManualTrigger(job.jobname)}
                        disabled={actionLoading === job.jobname || job.jobname === 'cron_system_unavailable' || job.jobname === 'error_listing_jobs'}
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
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Horaire :</span>
                        <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                          {getScheduleDescription(job.schedule)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">ID :</span>
                        <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                          {job.jobid === 0 ? 'N/A' : job.jobid}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Type :</span>
                        <span className="ml-2 text-gray-900 dark:text-gray-100">
                          {job.jobid > 0 ? '🤖 Auto' : '👆 Manuel'}
                        </span>
                      </div>
                    </div>
                    
                    {job.jobid > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                          Voir la commande SQL
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                          {job.command}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                  📅 Planning configuré (lundi au vendredi uniquement)
                </h4>
                <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <div>🗓️ <strong>Du lundi au vendredi</strong> (aucun envoi le week-end)</div>
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