import { supabase } from '../lib/supabase';

/**
 * Service pour tester manuellement l'envoi du récapitulatif quotidien des profils pour besoins clients
 */

export interface DailyClientNeedsSummaryResult {
  success: boolean;
  emailsSent: number;
  totalSalesReps: number;
  results: Array<{
    salesRep: string;
    email: string;
    pendingClientNeeds: number;
    emailSent: boolean;
    messageId?: string;
    error?: string;
    reason?: string;
  }>;
}

/**
 * Déclenche manuellement l'envoi du récapitulatif quotidien des profils pour besoins clients
 * Utile pour tester le système
 */
export async function triggerDailyClientNeedsSummary(): Promise<DailyClientNeedsSummaryResult> {
  try {
    console.log('Triggering manual daily client needs summary...');
    
    const { data, error } = await supabase.functions.invoke('send-daily-client-needs-summary', {
      body: {}
    });

    if (error) {
      console.error('Error invoking daily client needs summary function:', error);
      throw new Error(`Erreur lors de l'envoi du récapitulatif: ${error.message}`);
    }

    if (!data?.success) {
      console.error('Daily client needs summary function returned error:', data);
      throw new Error('Erreur lors de l\'envoi du récapitulatif quotidien des profils pour besoins clients');
    }

    console.log('Daily client needs summary triggered successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to trigger daily client needs summary:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques des profils pour besoins clients en attente par commercial
 * Utile pour vérifier l'état avant l'envoi
 */
export async function getDailyClientNeedsSummaryStats(): Promise<Array<{
  salesRepCode: string;
  salesRepName: string;
  pendingClientNeeds: number;
}>> {
  try {
    console.log('Fetching daily client needs summary stats...');
    
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

    // Pour chaque commercial, compter les profils en attente
    const stats = await Promise.all(
      salesReps.map(async (salesRep) => {
        // Récupérer les profils depuis le localStorage global
        let pendingClientNeeds = 0;
        try {
          // Récupérer tous les profils de besoins clients stockés dans le localStorage
          const storageKey = 'clientNeeds';
          const savedData = localStorage.getItem(storageKey);
          if (savedData) {
            try {
              const clientNeeds = JSON.parse(savedData);
              pendingClientNeeds = clientNeeds.filter(need => 
                need.status === 'À traiter' && 
                need.assignedTo === salesRep.id
              ).length;
              console.log(`Found ${pendingClientNeeds} pending client needs for ${salesRep.code} in localStorage`);
            } catch (parseError) {
              console.error(`Error parsing client needs for ${salesRep.code}:`, parseError);
            }
          }
        } catch (error) {
          console.error(`Error counting client needs for ${salesRep.code}:`, error);
        }

        return {
          salesRepCode: salesRep.code,
          salesRepName: salesRep.name,
          pendingClientNeeds
        };
      })
    );

    console.log('Daily client needs summary stats:', stats);
    return stats;
  } catch (error) {
    console.error('Failed to get daily client needs summary stats:', error);
    throw error;
  }
}

/**
 * Vérifie si le système de cron est configuré correctement pour les profils de besoins clients
 */
export async function checkClientNeedsCronStatus(): Promise<{
  isConfigured: boolean;
  jobName: string;
  schedule: string;
  active: boolean;
  nextRun?: string;
}> {
  try {
    console.log('Checking client needs cron job status...');
    
    const { data, error } = await supabase
      .rpc('get_cron_job_status', { job_name: 'daily-client-needs-summary' });

    if (error) {
      console.error('Error checking client needs cron status:', error);
      return {
        isConfigured: false,
        jobName: 'daily-client-needs-summary',
        schedule: '2 7 * * *', // 9h02 heure française (7h02 UTC)
        active: false
      };
    }

    return {
      isConfigured: !!data,
      jobName: 'daily-client-needs-summary',
      schedule: '2 7 * * *', // 9h02 heure française (7h02 UTC)
      active: data?.active || false,
      nextRun: data?.next_run
    };
  } catch (error) {
    console.error('Failed to check client needs cron status:', error);
    return {
      isConfigured: false,
      jobName: 'daily-client-needs-summary',
      schedule: '2 7 * * *', // 9h02 heure française (7h02 UTC)
      active: false
    };
  }
}