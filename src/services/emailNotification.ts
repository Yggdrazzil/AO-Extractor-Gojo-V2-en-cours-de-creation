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
      
      // Log détaillé pour le debugging
      if (error.context) {
        console.error('Error context:', error.context);
      }
      
      // Don't throw error for email failures, just log and return false
      console.warn('Email notification failed, but continuing with RFP creation');
      return false;
    }

    if (!result?.success) {
      console.error('Email function returned error:', result);
      console.warn('Email notification failed, but continuing with RFP creation');
      return false;
    }

    console.log('Email notification sent successfully to:', result.recipient);
    if (result.messageId) {
      console.log('Resend message ID:', result.messageId);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send RFP notification:', error);
    console.warn('Email notification failed, but continuing with RFP creation');
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

/**
 * Teste l'envoi d'email (fonction utilitaire pour le debugging)
 */
export async function testEmailNotification(salesRepId: string): Promise<boolean> {
  const testData: RFPNotificationData = {
    rfpId: 'test-rfp-id',
    client: 'Client Test',
    mission: 'Mission de test',
    salesRepCode: 'TEST',
    assignedTo: salesRepId
  };

  return await sendRFPNotification(testData);
}