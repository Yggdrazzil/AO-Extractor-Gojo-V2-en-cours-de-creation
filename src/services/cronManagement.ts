import { supabase } from '../lib/supabase';

/**
 * Service pour gérer la configuration des tâches automatiques (cron jobs)
 */

export interface CronJobStatus {
  exists: boolean;
  active: boolean;
  schedule: string | null;
  nextRun: string | null;
  jobDetails?: any;
}

export interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  command: string;
}

export interface DailyEmailStats {
  sales_rep_code: string;
  sales_rep_name: string;
  sales_rep_email: string;
  pending_rfps: number;
  pending_prospects: number;
  pending_client_needs: number;
}

/**
 * Vérifie le statut d'un cron job spécifique
 * @param jobName Nom du job à vérifier
 * @returns Statut du cron job
 */
export async function getCronJobStatus(jobName: string): Promise<CronJobStatus> {
  try {
    console.log(`Checking cron job status for: ${jobName}`);
    
    const { data, error } = await supabase.rpc('get_cron_job_status', {
      job_name: jobName
    });

    if (error) {
      console.error(`Error checking cron job ${jobName}:`, error);
      return {
        exists: false,
        active: false,
        schedule: null,
        nextRun: null
      };
    }

    console.log(`Cron job ${jobName} status:`, data);
    return {
      exists: data?.exists || false,
      active: data?.active || false,
      schedule: data?.schedule || null,
      nextRun: data?.next_run || null,
      jobDetails: data?.job_details || null
    };
  } catch (error) {
    console.error(`Failed to check cron job ${jobName}:`, error);
    return {
      exists: false,
      active: false,
      schedule: null,
      nextRun: null
    };
  }
}

/**
 * Liste tous les cron jobs de l'application
 * @returns Liste des cron jobs
 */
export async function listCronJobs(): Promise<CronJob[]> {
  try {
    console.log('Fetching all cron jobs...');
    
    const { data, error } = await supabase.rpc('list_cron_jobs');

    if (error) {
      console.error('Error listing cron jobs:', error);
      return [];
    }

    console.log('Cron jobs found:', data);
    return data || [];
  } catch (error) {
    console.error('Failed to list cron jobs:', error);
    return [];
  }
}

/**
 * Teste manuellement l'exécution des cron jobs
 * @returns Résultat du test
 */
export async function testCronJobs(): Promise<{ success: boolean; message: string; timestamp: string }> {
  try {
    console.log('Testing cron jobs manually...');
    
    // Tester directement les fonctions Edge comme pour les notifications individuelles
    const testResults = [];
    let totalTests = 0;
    let successfulTests = 0;
    
    // Test 1: Récapitulatif AOs (send-daily-rfp-summary)
    totalTests++;
    try {
      console.log('Testing send-daily-rfp-summary...');
      const { data: rfpData, error: rfpError } = await supabase.functions.invoke('send-daily-rfp-summary', {
        body: {}
      });
      
      if (rfpError) {
        console.error('RFP summary test error:', rfpError);
        testResults.push(`❌ AOs: ${rfpError.message}`);
      } else if (rfpData?.success) {
        successfulTests++;
        testResults.push(`✅ AOs: ${rfpData.emailsSent}/${rfpData.totalSalesReps} emails envoyés`);
      } else {
        testResults.push(`❌ AOs: ${rfpData?.message || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('RFP summary test exception:', error);
      testResults.push(`❌ AOs: Exception - ${error.message}`);
    }
    
    // Test 2: Récapitulatif Prospects (send-daily-prospects-summary)  
    totalTests++;
    try {
      console.log('Testing send-daily-prospects-summary...');
      const { data: prospectsData, error: prospectsError } = await supabase.functions.invoke('send-daily-prospects-summary', {
        body: {}
      });
      
      if (prospectsError) {
        console.error('Prospects summary test error:', prospectsError);
        testResults.push(`❌ Prospects: ${prospectsError.message}`);
      } else if (prospectsData?.success) {
        successfulTests++;
        testResults.push(`✅ Prospects: ${prospectsData.emailsSent}/${prospectsData.totalSalesReps} emails envoyés`);
      } else {
        testResults.push(`❌ Prospects: ${prospectsData?.message || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Prospects summary test exception:', error);
      testResults.push(`❌ Prospects: Exception - ${error.message}`);
    }
    
    // Test 3: Récapitulatif Besoins Clients (send-daily-client-needs-summary)
    totalTests++;
    try {
      console.log('Testing send-daily-client-needs-summary...');
      const { data: clientNeedsData, error: clientNeedsError } = await supabase.functions.invoke('send-daily-client-needs-summary', {
        body: {}
      });
      
      if (clientNeedsError) {
        console.error('Client needs summary test error:', clientNeedsError);
        testResults.push(`❌ Besoins Clients: ${clientNeedsError.message}`);
      } else if (clientNeedsData?.success) {
        successfulTests++;
        testResults.push(`✅ Besoins Clients: ${clientNeedsData.emailsSent}/${clientNeedsData.totalSalesReps} emails envoyés`);
      } else {
        testResults.push(`❌ Besoins Clients: ${clientNeedsData?.message || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Client needs summary test exception:', error);
      testResults.push(`❌ Besoins Clients: Exception - ${error.message}`);
    }
    
    // Résumé final
    const allSuccessful = successfulTests === totalTests;
    const message = allSuccessful 
      ? `✅ Tous les tests ont réussi ! ${successfulTests}/${totalTests} fonctions opérationnelles`
      : `⚠️ ${successfulTests}/${totalTests} fonctions ont réussi. Détails: ${testResults.join(' | ')}`;
    
    const result = {
      success: allSuccessful,
      message,
      timestamp: new Date().toISOString()
    };
    
    console.log('Test cron jobs result:', result);
    return result;
  } catch (error) {
    console.error('Failed to test cron jobs:', error);
    return {
      success: false,
      message: `Erreur lors du test: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Récupère les statistiques quotidiennes pour les emails
 * @returns Statistiques par commercial
 */
export async function getDailyEmailStats(): Promise<DailyEmailStats[]> {
  try {
    console.log('Fetching daily email stats...');
    
    // Récupérer tous les commerciaux
    const { data: salesReps, error: salesError } = await supabase
      .from('sales_reps')
      .select('id, name, code, email');

    if (salesError) {
      console.error('Error fetching sales reps:', salesError);
      throw new Error(salesError.message);
    }

    const stats: DailyEmailStats[] = [];

    // Pour chaque commercial, compter les éléments en attente
    for (const rep of salesReps || []) {
      // Compter les RFPs à traiter
      const { count: pendingRfps, error: rfpError } = await supabase
        .from('rfps')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', rep.id)
        .eq('status', 'À traiter');

      if (rfpError) {
        console.error(`Error counting RFPs for ${rep.name}:`, rfpError);
      }

      // Compter les prospects à traiter
      const { count: pendingProspects, error: prospectError } = await supabase
        .from('prospects')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', rep.id)
        .eq('status', 'À traiter');

      if (prospectError) {
        console.error(`Error counting prospects for ${rep.name}:`, prospectError);
      }

      // Compter les besoins clients à traiter
      const { count: pendingClientNeeds, error: clientNeedsError } = await supabase
        .from('client_needs')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', rep.id)
        .eq('status', 'À traiter');

      if (clientNeedsError) {
        console.error(`Error counting client needs for ${rep.name}:`, clientNeedsError);
      }

      stats.push({
        sales_rep_code: rep.code,
        sales_rep_name: rep.name,
        sales_rep_email: rep.email,
        pending_rfps: pendingRfps || 0,
        pending_prospects: pendingProspects || 0,
        pending_client_needs: pendingClientNeeds || 0
      });
    }

    console.log('Daily email stats:', stats);
    return stats;
  } catch (error) {
    console.error('Failed to fetch daily email stats:', error);
    throw error;
  }
}

/**
 * Vérifie l'état global du système de notifications automatiques
 * @returns État global du système
 */
export async function checkNotificationSystemHealth(): Promise<{
  cronJobs: {
    rfpSummary: CronJobStatus;
    prospectsSummary: CronJobStatus;
    clientNeedsSummary: CronJobStatus;
  };
  stats: DailyEmailStats[];
  isHealthy: boolean;
}> {
  try {
    console.log('Checking notification system health...');
    
    // Vérifier le statut de chaque cron job
    const [rfpSummary, prospectsSummary, clientNeedsSummary, stats] = await Promise.all([
      getCronJobStatus('daily-rfp-summary'),
      getCronJobStatus('daily-prospects-summary'),
      getCronJobStatus('daily-client-needs-summary'),
      getDailyEmailStats()
    ]);

    const isHealthy = rfpSummary.exists && rfpSummary.active && 
                     prospectsSummary.exists && prospectsSummary.active &&
                     clientNeedsSummary.exists && clientNeedsSummary.active;

    return {
      cronJobs: {
        rfpSummary,
        prospectsSummary,
        clientNeedsSummary
      },
      stats,
      isHealthy
    };
  } catch (error) {
    console.error('Failed to check notification system health:', error);
    throw error;
  }
}