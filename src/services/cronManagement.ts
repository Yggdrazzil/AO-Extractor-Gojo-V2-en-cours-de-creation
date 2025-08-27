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
    
    // Au lieu d'appeler la fonction RPC manquante, on va tester directement les fonctions Edge
    const results = [];
    
    // Test 1: Fonction AO
    try {
      const { data: rfpResult, error: rfpError } = await supabase.functions.invoke('send-daily-rfp-summary', {
        body: { test: true }
      });
      
      if (rfpError) {
        results.push({ function: 'send-daily-rfp-summary', success: false, error: rfpError.message });
      } else {
        results.push({ function: 'send-daily-rfp-summary', success: true, result: rfpResult });
      }
    } catch (rfpError) {
      results.push({ function: 'send-daily-rfp-summary', success: false, error: rfpError.message });
    }
    
    // Test 2: Fonction Prospects
    try {
      const { data: prospectsResult, error: prospectsError } = await supabase.functions.invoke('send-daily-prospects-summary', {
        body: { test: true }
      });
      
      if (prospectsError) {
        results.push({ function: 'send-daily-prospects-summary', success: false, error: prospectsError.message });
      } else {
        results.push({ function: 'send-daily-prospects-summary', success: true, result: prospectsResult });
      }
    } catch (prospectsError) {
      results.push({ function: 'send-daily-prospects-summary', success: false, error: prospectsError.message });
    }
    
    // Test 3: Fonction Besoins Clients
    try {
      const { data: clientNeedsResult, error: clientNeedsError } = await supabase.functions.invoke('send-daily-client-needs-summary', {
        body: { test: true }
      });
      
      if (clientNeedsError) {
        results.push({ function: 'send-daily-client-needs-summary', success: false, error: clientNeedsError.message });
      } else {
        results.push({ function: 'send-daily-client-needs-summary', success: true, result: clientNeedsResult });
      }
    } catch (clientNeedsError) {
      results.push({ function: 'send-daily-client-needs-summary', success: false, error: clientNeedsError.message });
    }
    
    const allSuccessful = results.every(r => r.success);
    const data = {
      success: allSuccessful,
      message: allSuccessful 
        ? `Tous les tests ont réussi (${results.length}/3 fonctions testées)`
        : `${results.filter(r => r.success).length}/${results.length} fonctions ont réussi le test`,
      timestamp: new Date().toISOString(),
      details: results
    };

    if (error) {
      const errorMsg = `Certaines fonctions ont échoué: ${results.filter(r => !r.success).map(r => r.function).join(', ')}`;
      console.error('Some functions failed:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('All functions test successful:', data);
    return data;
  } catch (error) {
    console.error('Failed to test cron jobs:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques quotidiennes pour tous les commerciaux
 * @returns Statistiques d'envoi par commercial
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