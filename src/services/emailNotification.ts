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
      
      // Handle specific error cases
      if (error.message && error.message.includes('RESEND_API_KEY')) {
        console.warn('Email notification skipped: Resend API key not configured');
        return false;
      }
      
      // Handle CORS and network errors gracefully
      if (error.context && error.context.status === 500) {
        console.warn('Email notification failed: Server error (likely configuration issue)');
        return false;
      }
      
      return false;
    }

    if (!result?.success) {
      console.error('Email function returned error:', result);
      
      // Handle configuration errors gracefully
      if (result?.details) {
        if (result.details.includes('RESEND_API_KEY')) {
          console.warn('Email notification skipped: Resend API key not configured in Edge Function settings');
          return false;
        }
      }
      return false;
    }

    console.log('Email notification sent successfully to:', result.recipient);
    return true;
  } catch (error) {
    console.error('Failed to send RFP notification:', error);
    
    // Don't throw errors for email failures - they should be non-blocking
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        console.warn('Email notification skipped: Network error');
      } else if (error.message.includes('RESEND_API_KEY')) {
        console.warn('Email notification skipped: API key configuration issue');
      }
    }
    
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