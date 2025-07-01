import { supabase } from '../lib/supabase';

interface ProspectNotificationData {
  prospectId: string;
  targetAccount: string;
  salesRepCode: string;
  assignedTo: string;
  hasCV: boolean;
  fileName?: string;
}

/**
 * Envoie une notification email pour un nouveau prospect avec délai
 */
export async function sendProspectNotification(data: ProspectNotificationData, delayMinutes: number = 0.5): Promise<boolean> {
  try {
    const delaySeconds = Math.round(delayMinutes * 60);
    console.log(`Scheduling prospect notification in ${delaySeconds} seconds:`, {
      prospectId: data.prospectId,
      targetAccount: data.targetAccount,
      salesRepCode: data.salesRepCode,
      assignedTo: data.assignedTo,
      hasCV: data.hasCV
    });

    // Programmer l'envoi avec un délai
    setTimeout(async () => {
      try {
        console.log(`Sending delayed prospect notification after ${delaySeconds} seconds...`);
        
        // Récupérer les données actualisées du prospect pour avoir le compte ciblé correct
        const { data: prospectData, error: prospectError } = await supabase
          .from('prospects')
          .select('target_account, file_name')
          .eq('id', data.prospectId)
          .single();

        if (prospectError || !prospectData) {
          console.error('Error fetching updated prospect data:', prospectError);
          return;
        }

        // Utiliser les données actualisées
        const updatedData = {
          ...data,
          targetAccount: prospectData.target_account,
          fileName: prospectData.file_name,
          hasCV: !!prospectData.file_name
        };

        const { data: result, error } = await supabase.functions.invoke('send-prospect-notification', {
          body: updatedData
        });

        if (error) {
          console.error('Error invoking prospect email function:', error);
          return;
        }

        if (!result?.success) {
          console.error('Prospect email function returned error:', result);
          return;
        }

        console.log('Delayed prospect email notification sent successfully to:', result.recipient);
      } catch (error) {
        console.error('Error in delayed prospect email sending:', error);
      }
    }, delayMinutes * 60 * 1000); // Convertir minutes en millisecondes
    
    return true;
  } catch (error) {
    console.error('Failed to send prospect notification:', error);
    return false;
  }
}

/**
 * Teste l'envoi d'email de prospect (fonction utilitaire pour le debugging)
 */
export async function testProspectEmailNotification(salesRepId: string, targetAccount: string): Promise<boolean> {
  const testData: ProspectNotificationData = {
    prospectId: 'test-prospect-id',
    targetAccount: targetAccount,
    salesRepCode: 'TEST',
    assignedTo: salesRepId,
    hasCV: false
  };

  return await sendProspectNotification(testData);
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
    if (error || !data) {
      console.error('Error fetching sales rep code:', error);
      return null;
    }
      .single();
    return data.code;
  } catch (error) {
    console.error('Failed to get sales rep code:', error);
    return null;
  }
}