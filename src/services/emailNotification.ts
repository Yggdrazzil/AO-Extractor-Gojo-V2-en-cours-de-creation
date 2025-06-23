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
    console.log('Sending RFP notification:', {
      rfpId: data.rfpId,
      client: data.client,
      mission: data.mission,
      salesRepCode: data.salesRepCode,
      assignedTo: data.assignedTo
    });

    const { data: result, error } = await supabase.functions.invoke('send-rfp-notification', {
      body: data
    });

    if (error) {
      console.error('Error invoking email function:', error);
      
      // Log more detailed error information
      if (error.message) {
        console.error('Error details:', error.message);
      }
      if (error.context) {
        console.error('Error context:', error.context);
      }
      return false;
    }

    if (!result?.success) {
      console.error('Email function returned error:', result);
      
      // Show user-friendly error message if available
      if (result?.details) {
        console.error('Error details:', result.details);
        
        // Check for specific configuration errors
        if (result.details.includes('RESEND_API_KEY')) {
          console.error('Configuration Error: Resend API key is not configured in Supabase Edge Function settings');
        }
      }
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

/**
 * Récupère l'email du commercial depuis l'ID
 */
export async function getSalesRepEmail(salesRepId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('email')
      .eq('id', salesRepId)
      .single();

    if (error || !data) {
      console.error('Error fetching sales rep email:', error);
      return null;
    }

    return data.email;
  } catch (error) {
    console.error('Failed to get sales rep email:', error);
    return null;
  }
}