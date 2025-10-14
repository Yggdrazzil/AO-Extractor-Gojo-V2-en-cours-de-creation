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
 * Envoie une notification email pour un nouveau profil de besoin client
 */
export async function sendClientNeedNotification(data: ClientNeedNotificationData, delaySeconds: number = 5): Promise<boolean> {
  try {
    console.log('🚀 Sending client need notification IMMEDIATELY (no delay):', {
      prospectId: data.prospectId,
      besoin: data.besoin,
      salesRepCode: data.salesRepCode,
      assignedTo: data.assignedTo,
      hasCV: data.hasCV
    });

    // Envoi immédiat sans setTimeout
    try {
      console.log('📧 Calling Edge Function immediately...');
      
      console.log('📤 Calling send-client-need-notification with data:', data);
      
      const { data: result, error } = await supabase.functions.invoke('send-client-need-notification', {
        body: data
      });

      if (error) {
        console.error('❌ Error invoking client need email function:', error);
        return false;
      }

      if (!result?.success) {
        console.error('❌ Client need email function returned error:', result);
        return false;
      }

      console.log('✅ Client need email notification sent successfully to:', result.recipient);
      return true;
    } catch (error) {
      console.error('❌ Error in client need email sending:', error);
      return false;
    }
  } catch (error) {
    console.error('💥 Failed to send client need notification:', error);
    return false;
  }
}

/**
 * Récupère le code commercial depuis l'ID
 */
export async function getSalesRepCode(salesRepId: string): Promise<string | null> {
  try {
    if (!salesRepId) {
      return null;
    }

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