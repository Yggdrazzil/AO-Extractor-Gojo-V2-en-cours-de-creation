import { supabase } from '../lib/supabase';

interface RFPNotificationData {
  rfpId: string;
  client: string;
  mission: string;
  location?: string;
  salesRepCode: string;
  assignedTo: string;
}

/**
 * Envoie une notification email pour un nouvel AO
 */
export async function sendRFPNotification(data: RFPNotificationData, delaySeconds: number = 5): Promise<boolean> {
  try {
    console.log(`🚀 Sending RFP notification (${delaySeconds}s delay):`, {
      rfpId: data.rfpId,
      client: data.client,
      mission: data.mission,
      location: data.location,
      salesRepCode: data.salesRepCode,
      assignedTo: data.assignedTo
    });

    // Programmer l'envoi avec un délai court pour éviter les problèmes de timing
    setTimeout(async () => {
      try {
        console.log(`📧 Sending RFP notification now...`);
        
        // Récupérer les données actualisées de l'AO pour avoir le client correct
        const { data: rfpData, error: rfpError } = await supabase
          .from('rfps')
          .select('client, mission, location')
          .eq('id', data.rfpId)
          .single();

        if (rfpError || !rfpData) {
          console.error('Error fetching updated RFP data:', rfpError);
          return;
        }

        // Utiliser les données actualisées
        const updatedData = {
          ...data,
          client: rfpData.client,
          mission: rfpData.mission,
          location: rfpData.location
        };

        const { data: result, error } = await supabase.functions.invoke('send-rfp-notification', {
          body: updatedData
        });

        if (error) {
          console.error('Error invoking email function:', error);
          return;
        }

        if (!result?.success) {
          console.error('Email function returned error:', result);
          return;
        }

        console.log('✅ RFP email notification sent successfully to:', result.recipient);
      } catch (error) {
        console.error('❌ Error in RFP email sending:', error);
      }
    }, delaySeconds * 1000); // Délai en secondes
    
    return true;
  } catch (error) {
    console.error('Failed to send RFP notification:', error);
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
 * Teste l'envoi d'email d'AO (fonction utilitaire pour le debugging)
 */
export async function testRFPEmailNotification(salesRepId: string, client: string, mission: string): Promise<boolean> {
  const testData: RFPNotificationData = {
    rfpId: 'test-rfp-id',
    client: client || 'Client Test',
    mission: mission || 'Mission de test',
    salesRepCode: 'TEST',
    assignedTo: salesRepId
  };

  return await sendRFPNotification(testData, 0); // Envoi immédiat pour les tests
}