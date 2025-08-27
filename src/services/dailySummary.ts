import { supabase } from '../lib/supabase';

/**
 * Service pour tester manuellement l'envoi du récapitulatif quotidien
 */

export interface DailySummaryResult {
  success: boolean;
  emailsSent: number;
  totalSalesReps: number;
  results: Array<{
    salesRep: string;
    email: string;
    pendingRFPs: number;
    emailSent: boolean;
    messageId?: string;
    error?: string;
    reason?: string;
  }>;
}

/**
 * Déclenche manuellement l'envoi du récapitulatif quotidien
 * Utile pour tester le système
 */
export async function triggerDailySummary(): Promise<DailySummaryResult> {
  try {
    console.log('Triggering manual daily summary...');
    
    const { data, error } = await supabase.functions.invoke('send-daily-rfp-summary', {
      body: {}
    });

    if (error) {
      console.error('Error invoking daily summary function:', error);
      throw new Error(`Erreur lors de l'envoi du récapitulatif: ${error.message}`);
    }

    if (!data?.success) {
      console.error('Daily summary function returned error:', data);
      throw new Error('Erreur lors de l\'envoi du récapitulatif quotidien');
    }

    console.log('Daily summary triggered successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to trigger daily summary:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques des AOs en attente par commercial
 * Utile pour vérifier l'état avant l'envoi
 */
export async function getDailySummaryStats(): Promise<Array<{
  salesRepCode: string;
  salesRepName: string;
  pendingRFPs: number;
}>> {
  try {
    console.log('Fetching daily summary stats...');
    
    // Récupérer tous les commerciaux
    const { data: salesReps, error: salesRepsError } = await supabase
      .from('sales_reps')
      .select('id, name, code')
      .order('code');

    if (salesRepsError) {
      console.error('Error fetching sales reps:', salesRepsError);
      throw salesRepsError;
    }

    if (!salesReps || salesReps.length === 0) {
      return [];
    }

    // Pour chaque commercial, compter les AOs en attente
    const stats = await Promise.all(
      salesReps.map(async (salesRep) => {
        const { data: rfps, error: rfpsError } = await supabase
          .from('rfps')
          .select('id')
          .eq('assigned_to', salesRep.id)
          .eq('status', 'À traiter');

        if (rfpsError) {
          console.error(`Error fetching RFPs for ${salesRep.code}:`, rfpsError);
          return {
            salesRepCode: salesRep.code,
            salesRepName: salesRep.name,
            pendingRFPs: 0
          };
        }

        return {
          salesRepCode: salesRep.code,
          salesRepName: salesRep.name,
          pendingRFPs: rfps?.length || 0
        };
      })
    );

    console.log('Daily summary stats:', stats);
    return stats;
  } catch (error) {
    console.error('Failed to get daily summary stats:', error);
    throw error;
  }
}

/**
 * Vérifie si le système de cron est configuré correctement
 */
export async function checkCronStatus(): Promise<{
  isConfigured: boolean;
  jobName: string;
  schedule: string;
  active: boolean;
  nextRun?: string;
}> {
  try {
    console.log('Checking cron job status...');
    
    try {
      const { data, error } = await supabase
        .rpc('get_cron_job_status', { job_name: 'daily-rfp-summary' });

      if (error) {
        console.error('Error checking cron status:', error);
        return {
          isConfigured: false,
          jobName: 'daily-rfp-summary',
          schedule: '0 8 * * *', // 9h00 heure française
          active: false
        };
      }

      return {
        isConfigured: !!data,
        jobName: 'daily-rfp-summary',
        schedule: '0 8 * * *', // 9h00 heure française
        active: data?.active || false,
        nextRun: data?.next_run
      };
    } catch (rpcError) {
      console.error('RPC error checking cron status:', rpcError);
      return {
        isConfigured: false,
        jobName: 'daily-rfp-summary',
        schedule: '0 8 * * *', // 9h00 heure française
        active: false
      };
    }
  } catch (error) {
    console.error('Failed to check cron status:', error);
    return {
      isConfigured: false,
      jobName: 'daily-rfp-summary',
      schedule: '0 8 * * *', // 9h00 heure française
      active: false
    };
  }
}