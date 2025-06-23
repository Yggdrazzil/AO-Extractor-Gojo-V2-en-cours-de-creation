import { supabase } from '../lib/supabase';

interface RFPNotificationData {
  rfpId: string;
  client: string;
  mission: string;
  salesRepCode: string;
  assignedTo: string;
}

/**
 * Envoie une notification email pour un nouvel AO
 */
export async function sendRFPNotification(data: RFPNotificationData): Promise<boolean> {
  try {
    console.log('Sending RFP notification:', data);

    const { data: result, error } = await supabase.functions.invoke('send-rfp-notification', {
      body: data
    });

    if (error) {
      console.error('Error invoking email function:', error);
      return false;
    }

    if (!result?.success) {
      console.error('Email function returned error:', result);
      return false;
    }

    console.log('Email notification sent successfully to:', result.recipient);
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