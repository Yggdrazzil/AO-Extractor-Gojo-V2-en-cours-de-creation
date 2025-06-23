import { supabase } from '../lib/supabase';

export interface EmailNotificationData {
  rfpId: string;
  salesRepId: string;
  client: string;
  mission: string;
  location: string;
  maxRate?: number;
  startDate?: string;
}

/**
 * Envoie une notification email pour un nouvel AO
 * Cette fonction appelle directement la edge function Supabase
 */
export async function sendRFPNotification(data: EmailNotificationData): Promise<void> {
  try {
    console.log('Sending RFP notification email:', data);

    const { data: result, error } = await supabase.functions.invoke('send-rfp-notification', {
      body: {
        record: {
          id: data.rfpId,
          client: data.client,
          mission: data.mission,
          location: data.location,
          max_rate: data.maxRate,
          start_date: data.startDate,
          assigned_to: data.salesRepId,
          status: 'À traiter'
        }
      }
    });

    if (error) {
      console.error('Error calling email function:', error);
      throw new Error(`Erreur lors de l'envoi de l'email: ${error.message}`);
    }

    console.log('Email notification sent successfully:', result);
  } catch (error) {
    console.error('Failed to send RFP notification:', error);
    // Ne pas faire échouer la création de l'AO si l'email échoue
    console.warn('Email notification failed, but RFP creation will continue');
  }
}

/**
 * Teste la configuration email
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-rfp-notification', {
      body: {
        test: true,
        record: {
          id: 'test-id',
          client: 'Client Test',
          mission: 'Mission Test',
          location: 'Paris',
          max_rate: 500,
          start_date: new Date().toISOString(),
          assigned_to: 'test-sales-rep-id',
          status: 'À traiter'
        }
      }
    });

    if (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }

    console.log('Email configuration test successful:', data);
    return true;
  } catch (error) {
    console.error('Email configuration test error:', error);
    return false;
  }
}