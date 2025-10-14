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
 * Envoie une notification email pour un nouveau prospect
 */
export async function sendProspectNotification(data: ProspectNotificationData, delaySeconds: number = 5): Promise<boolean> {
  try {
    console.log('🚀 Sending prospect notification IMMEDIATELY (no delay):', {
      prospectId: data.prospectId,
      targetAccount: data.targetAccount,
      salesRepCode: data.salesRepCode,
      assignedTo: data.assignedTo,
      hasCV: data.hasCV
    });

    // Envoi immédiat sans setTimeout
    try {
      console.log('📧 Calling Edge Function immediately...');
      
      // Récupérer les données actualisées du prospect pour avoir le compte ciblé correct
      const { data: prospectData, error: prospectError } = await supabase
        .from('prospects')
        .select('target_account, file_name')
        .eq('id', data.prospectId)
        .single();

      if (prospectError || !prospectData) {
        console.error('❌ Error fetching updated prospect data:', prospectError);
        return false;
      }

      // Utiliser les données actualisées
      const updatedData = {
        ...data,
        targetAccount: prospectData.target_account,
        fileName: prospectData.file_name,
        hasCV: !!prospectData.file_name
      };

      console.log('📤 Calling send-prospect-notification with data:', updatedData);
      
      const { data: result, error } = await supabase.functions.invoke('send-prospect-notification', {
        body: updatedData
      });

      if (error) {
        console.error('❌ Error invoking prospect email function:', error);
        return false;
      }

      if (!result?.success) {
        console.error('❌ Prospect email function returned error:', result);
        return false;
      }

      console.log('✅ Prospect email notification sent successfully to:', result.recipient);
      return true;
    } catch (error) {
      console.error('❌ Error in prospect email sending:', error);
      return false;
    }
  } catch (error) {
    console.error('💥 Failed to send prospect notification:', error);
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