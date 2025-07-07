import { supabase } from '../lib/supabase';

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
    
    // Récupérer tous les commerciaux
    const { data: salesReps, error: salesRepsError } = await supabase
      .from('sales_reps')
      .select('id, name, code')
      .order('code');

    if (salesRepsError) {
      console.error('Error fetching sales reps:', salesRepsError);
      throw salesRepsError;
    }

        const { data: clientNeeds, error: clientNeedsError } = await supabase
          .from('client_needs')
          .select('id')
          .eq('assigned_to', salesRep.id)
          .eq('status', 'À traiter');

        if (clientNeedsError) {
          console.error(`Error fetching client needs for ${salesRep.code}:`, clientNeedsError);
          return {
            salesRepCode: salesRep.code,
            salesRepName: salesRep.name,
            pendingClientNeeds: 0
          };
        }

        return {
          salesRepCode: salesRep.code,
          salesRepName: salesRep.name,
          pendingClientNeeds: clientNeeds?.length || 0
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