import { supabase } from '../lib/supabase';

/**
 * Service pour tester manuellement l'envoi du récapitulatif quotidien des prospects
 */

export interface DailyProspectsSummaryResult {
  success: boolean;
  emailsSent: number;
  totalSalesReps: number;
  results: Array<{
    salesRep: string;
    email: string;
    pendingProspects: number;
    emailSent: boolean;
    messageId?: string;
    error?: string;
    reason?: string;
  }>;
}

/**
 * Déclenche manuellement l'envoi du récapitulatif quotidien des prospects
 * Utile pour tester le système
 */
export async function triggerDailyProspectsSummary(): Promise<DailyProspectsSummaryResult> {
  try {
    console.log('Triggering manual daily prospects summary...');
    
    const { data, error } = await supabase.functions.invoke('send-daily-prospects-summary', {
      body: {}
    });

    if (error) {
      console.error('Error invoking daily prospects summary function:', error);
      throw new Error(`Erreur lors de l'envoi du récapitulatif: ${error.message}`);
    }

    if (!data?.success) {
      console.error('Daily prospects summary function returned error:', data);
      throw new Error('Erreur lors de l\'envoi du récapitulatif quotidien des prospects');
    }

    console.log('Daily prospects summary triggered successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to trigger daily prospects summary:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques des prospects en attente par commercial
 * Utile pour vérifier l'état avant l'envoi
 */
export async function getDailyProspectsSummaryStats(): Promise<Array<{
  salesRepCode: string;
  salesRepName: string;
  pendingProspects: number;
}>> {
  try {
    console.log('Fetching daily prospects summary stats...');
    
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

    // Pour chaque commercial, compter les prospects en attente
    const stats = await Promise.all(
      salesReps.map(async (salesRep) => {
        const { data: prospects, error: prospectsError } = await supabase
          .from('prospects')
          .select('id')
          .eq('assigned_to', salesRep.id)
          .eq('status', 'À traiter');

        if (prospectsError) {
          console.error(`Error fetching prospects for ${salesRep.code}:`, prospectsError);
          return {
            salesRepCode: salesRep.code,
            salesRepName: salesRep.name,
            pendingProspects: 0
          };
        }

        return {
          salesRepCode: salesRep.code,
          salesRepName: salesRep.name,
          pendingProspects: prospects?.length || 0
        };
      })
    );

    console.log('Daily prospects summary stats:', stats);
    return stats;
  } catch (error) {
    console.error('Failed to get daily prospects summary stats:', error);
    throw error;
  }
}

/**
 * Vérifie si le système de cron est configuré correctement pour les prospects
 */
export async function checkProspectsCronStatus(): Promise<{
  isConfigured: boolean;
  jobName: string;
  schedule: string;
  active: boolean;
  nextRun?: string;
}> {
  try {
    console.log('Checking prospects cron job status...');
    
    const { data, error } = await supabase
      .rpc('get_cron_job_status', { job_name: 'daily-prospects-summary' });

    if (error) {
      console.error('Error checking prospects cron status:', error);
      return {
        isConfigured: false,
        jobName: 'daily-prospects-summary',
        schedule: '1 7 * * *',
        active: false
      };
    }

    return {
      isConfigured: !!data,
      jobName: 'daily-prospects-summary',
      schedule: '1 7 * * *',
      active: data?.active || false,
      nextRun: data?.next_run
    };
  } catch (error) {
    console.error('Failed to check prospects cron status:', error);
    return {
      isConfigured: false,
      jobName: 'daily-prospects-summary',
      schedule: '1 7 * * *',
      active: false
    };
  }
}