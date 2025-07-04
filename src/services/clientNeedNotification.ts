import { supabase } from '../lib/supabase';

interface ClientNeedNotificationData {
  prospectId: string;
  besoin: string;
  salesRepCode: string;
  assignedTo: string;
  hasCV: boolean;
  fileName?: string;
}

/**
 * Envoie une notification email pour un nouveau profil de besoin client avec délai
 */
export async function sendClientNeedNotification(data: ClientNeedNotificationData, delayMinutes: number = 0.5): Promise<boolean> {
  try {
    const delaySeconds = Math.round(delayMinutes * 60);
    console.log(`Scheduling client need notification in ${delaySeconds} seconds:`, {
      prospectId: data.prospectId,
      besoin: data.besoin,
      salesRepCode: data.salesRepCode,
      assignedTo: data.assignedTo,
      hasCV: data.hasCV
    });

    // Programmer l'envoi avec un délai
    setTimeout(async () => {
      try {
        console.log(`Sending delayed client need notification after ${delaySeconds} seconds...`);
        
        const { data: result, error } = await supabase.functions.invoke('send-client-need-notification', {
          body: data
        });

        if (error) {
          console.error('Error invoking client need email function:', error);
          return;
        }

        if (!result?.success) {
          console.error('Client need email function returned error:', result);
          return;
        }

        console.log('Delayed client need email notification sent successfully to:', result.recipient);
      } catch (error) {
        console.error('Error in delayed client need email sending:', error);
      }
    }, delayMinutes * 60 * 1000); // Convertir minutes en millisecondes
    
    return true;
  } catch (error) {
    console.error('Failed to send client need notification:', error);
    return false;
  }
}

/**
 * Récupère le code commercial depuis l'ID
 */
export async function getSalesRepCode(salesRepId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('code')
      .eq('id', salesRepId)
      .single();

    if (error || !data) {
      console.error('Error fetching sales rep code:', error);
      return null;
    }

    return data.code;
  } catch (error) {
    console.error('Failed to get sales rep code:', error);
    return null;
  }
}

/**
 * Teste l'envoi d'email de besoin client (fonction utilitaire pour le debugging)
 */
export async function testClientNeedEmailNotification(salesRepId: string, besoin: string): Promise<boolean> {
  const testData: ClientNeedNotificationData = {
    prospectId: 'test-prospect-id',
    besoin: besoin || 'Besoin test',
    salesRepCode: 'TEST',
    assignedTo: salesRepId,
    hasCV: false
  };

  return await sendClientNeedNotification(testData);
}