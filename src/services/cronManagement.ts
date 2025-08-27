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
    
    const { data, error } = await supabase.rpc('test_cron_jobs');

    if (error) {
      console.error('Error testing cron jobs:', error);
      throw new Error(error.message);
    }

    console.log('Cron jobs test result:', data);
    return data || { success: false, message: 'No data returned', timestamp: new Date().toISOString() };
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
    
    const { data, error } = await supabase.rpc('get_daily_email_stats');

    if (error) {
      console.error('Error fetching daily email stats:', error);
      throw new Error(error.message);
    }

    console.log('Daily email stats:', data);
    return data || [];
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