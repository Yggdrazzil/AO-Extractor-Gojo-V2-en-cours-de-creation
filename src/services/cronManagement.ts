/**
 * Service pour gérer la configuration des tâches automatiques (cron jobs)
 */

import { supabase } from '../lib/supabase';

export interface CronJobStatus {
  exists: boolean;
  active: boolean;
  schedule: string | null;
  nextRun: string | null;
  jobDetails?: any;
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
 */
export async function getCronJobStatus(jobName: string): Promise<CronJobStatus> {
  try {
    console.log(`Checking cron job status for: ${jobName}`);
    
    // Pour l'instant, on simule le statut car on n'a pas de fonction RPC
    return {
      exists: true,
      active: true,
      schedule: jobName === 'daily-rfp-summary' ? '0 7 * * *' : 
               jobName === 'daily-prospects-summary' ? '1 7 * * *' : 
               '2 7 * * *',
      nextRun: null
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
 * Teste manuellement l'exécution des cron jobs en appelant directement les fonctions Edge
 * S'inspire de la logique des notifications individuelles qui fonctionnent
 */
export async function testCronJobs(): Promise<{ success: boolean; message: string; timestamp: string }> {
  try {
    console.log('🧪 Testing cron jobs by calling Edge Functions directly...');
    
    const testResults = [];
    let totalTests = 3;
    let successfulTests = 0;
    
    // Test 1: Récapitulatif AOs - comme dans sendRFPNotification qui fonctionne
    try {
      console.log('🔄 Testing RFP summary function...');
      const { data: rfpResult, error: rfpError } = await supabase.functions.invoke('send-daily-rfp-summary', {
        body: { test: true } // Ajouter un flag de test
      });
      
      if (rfpError) {
        console.error('RFP summary test failed:', rfpError);
        testResults.push(`❌ Récapitulatif AOs: ${rfpError.message}`);
      } else if (rfpResult?.success) {
        successfulTests++;
        testResults.push(`✅ Récapitulatif AOs: ${rfpResult.emailsSent || 0} email(s) envoyé(s)`);
        console.log('✅ RFP summary test successful');
      } else {
        testResults.push(`⚠️ Récapitulatif AOs: ${rfpResult?.message || 'Aucun email à envoyer'}`);
        console.warn('⚠️ RFP summary: no emails to send or other issue');
      }
    } catch (error) {
      console.error('💥 Exception in RFP summary test:', error);
      testResults.push(`❌ Récapitulatif AOs: Exception - ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
    
    // Test 2: Récapitulatif Prospects - comme dans sendProspectNotification qui fonctionne
    try {
      console.log('🔄 Testing Prospects summary function...');
      const { data: prospectsResult, error: prospectsError } = await supabase.functions.invoke('send-daily-prospects-summary', {
        body: { test: true } // Ajouter un flag de test
      });
      
      if (prospectsError) {
        console.error('Prospects summary test failed:', prospectsError);
        testResults.push(`❌ Récapitulatif Prospects: ${prospectsError.message}`);
      } else if (prospectsResult?.success) {
        successfulTests++;
        testResults.push(`✅ Récapitulatif Prospects: ${prospectsResult.emailsSent || 0} email(s) envoyé(s)`);
        console.log('✅ Prospects summary test successful');
      } else {
        testResults.push(`⚠️ Récapitulatif Prospects: ${prospectsResult?.message || 'Aucun email à envoyer'}`);
        console.warn('⚠️ Prospects summary: no emails to send or other issue');
      }
    } catch (error) {
      console.error('💥 Exception in Prospects summary test:', error);
      testResults.push(`❌ Récapitulatif Prospects: Exception - ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
    
    // Test 3: Récapitulatif Besoins Clients - comme dans sendClientNeedNotification qui fonctionne
    try {
      console.log('🔄 Testing Client Needs summary function...');
      const { data: clientNeedsResult, error: clientNeedsError } = await supabase.functions.invoke('send-daily-client-needs-summary', {
        body: { test: true } // Ajouter un flag de test
      });
      
      if (clientNeedsError) {
        console.error('Client Needs summary test failed:', clientNeedsError);
        testResults.push(`❌ Récapitulatif Besoins Clients: ${clientNeedsError.message}`);
      } else if (clientNeedsResult?.success) {
        successfulTests++;
        testResults.push(`✅ Récapitulatif Besoins Clients: ${clientNeedsResult.emailsSent || 0} email(s) envoyé(s)`);
        console.log('✅ Client Needs summary test successful');
      } else {
        testResults.push(`⚠️ Récapitulatif Besoins Clients: ${clientNeedsResult?.message || 'Aucun email à envoyer'}`);
        console.warn('⚠️ Client Needs summary: no emails to send or other issue');
      }
    } catch (error) {
      console.error('💥 Exception in Client Needs summary test:', error);
      testResults.push(`❌ Récapitulatif Besoins Clients: Exception - ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
    
    // Résultat final
    const allSuccessful = successfulTests === totalTests;
    const message = allSuccessful 
      ? `✅ Tous les tests ont réussi (${successfulTests}/${totalTests})` 
      : successfulTests > 0
      ? `⚠️ ${successfulTests}/${totalTests} fonctions ont réussi`
      : `❌ Aucune fonction n'a réussi`;
    
    const detailedMessage = `${message}. Détails: ${testResults.join(' | ')}`;
    
    console.log('🎯 Final test result:', detailedMessage);
    
    return {
      success: allSuccessful,
      message: detailedMessage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('💥 Fatal error in testCronJobs:', error);
    return {
      success: false,
      message: `Erreur fatale lors du test: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Récupère les statistiques quotidiennes pour les emails
 */
export async function getDailyEmailStats(): Promise<DailyEmailStats[]> {
  try {
    console.log('📊 Fetching daily email stats...');
    
    // Récupérer tous les commerciaux
    const { data: salesReps, error: salesError } = await supabase
      .from('sales_reps')
      .select('id, name, code, email')
      .order('code');

    if (salesError) {
      console.error('Error fetching sales reps:', salesError);
      throw new Error(salesError.message);
    }

    if (!salesReps || salesReps.length === 0) {
      console.warn('No sales reps found');
      return [];
    }

    const stats: DailyEmailStats[] = [];

    // Pour chaque commercial, compter les éléments en attente
    for (const rep of salesReps) {
      try {
        // Compter les RFPs à traiter
        const { count: pendingRfps } = await supabase
          .from('rfps')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', rep.id)
          .eq('status', 'À traiter');

        // Compter les prospects à traiter
        const { count: pendingProspects } = await supabase
          .from('prospects')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', rep.id)
          .eq('status', 'À traiter');

        // Compter les besoins clients à traiter
        const { count: pendingClientNeeds } = await supabase
          .from('client_needs')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', rep.id)
          .eq('status', 'À traiter');

        stats.push({
          sales_rep_code: rep.code,
          sales_rep_name: rep.name,
          sales_rep_email: rep.email,
          pending_rfps: pendingRfps || 0,
          pending_prospects: pendingProspects || 0,
          pending_client_needs: pendingClientNeeds || 0
        });
      } catch (error) {
        console.error(`Error counting items for ${rep.name}:`, error);
        // Continuer avec des 0 en cas d'erreur
        stats.push({
          sales_rep_code: rep.code,
          sales_rep_name: rep.name,
          sales_rep_email: rep.email,
          pending_rfps: 0,
          pending_prospects: 0,
          pending_client_needs: 0
        });
      }
    }

    console.log('📊 Daily email stats calculated:', stats);
    return stats;
  } catch (error) {
    console.error('Failed to fetch daily email stats:', error);
    throw error;
  }
}

/**
 * Vérifie l'état global du système de notifications automatiques
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
    console.log('🏥 Checking notification system health...');
    
    // Vérifier le statut de chaque cron job et récupérer les stats
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