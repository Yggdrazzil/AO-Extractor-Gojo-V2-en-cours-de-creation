import { supabase } from '../lib/supabase';

export interface EmailSystemDiagnosis {
  success: boolean;
  status: 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  tests: Array<{
    component: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    details?: any;
  }>;
  summary: {
    total_tests: number;
    success_count: number;
    warning_count: number;
    error_count: number;
  };
}

/**
 * Lance un diagnostic complet du système d'emails
 */
export async function runEmailSystemDiagnosis(): Promise<EmailSystemDiagnosis> {
  try {
    console.log('🔍 Running email system diagnosis...');
    
    const { data, error } = await supabase.functions.invoke('test-email-system', {
      body: {}
    });

    if (error) {
      console.error('Error running email system diagnosis:', error);
      throw new Error(`Erreur lors du diagnostic: ${error.message}`);
    }

    console.log('Email system diagnosis completed:', data);
    return data;
  } catch (error) {
    console.error('Failed to run email system diagnosis:', error);
    throw error;
  }
}

/**
 * Teste l'envoi d'un email simple pour validation
 */
export async function testSimpleEmailSending(recipientEmail: string): Promise<{ success: boolean; message: string; messageId?: string }> {
  try {
    console.log(`Testing simple email sending to: ${recipientEmail}`);
    
    const { data, error } = await supabase.functions.invoke('test-email-system', {
      body: { 
        action: 'send_test_email',
        recipient: recipientEmail 
      }
    });

    if (error) {
      console.error('Error testing simple email:', error);
      throw new Error(`Erreur lors du test d'email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Failed to test simple email sending:', error);
    throw error;
  }
}

/**
 * Vérifie la configuration SendGrid depuis le frontend
 */
export async function checkSendGridConfigFromFrontend(): Promise<{
  configured: boolean;
  accessible: boolean;
  error?: string;
}> {
  try {
    // Test via une fonction Edge pour éviter les problèmes CORS
    const { data, error } = await supabase.functions.invoke('test-email-system', {
      body: { action: 'check_sendgrid_only' }
    });

    if (error) {
      return {
        configured: false,
        accessible: false,
        error: error.message
      };
    }

    return {
      configured: true,
      accessible: data?.sendgrid_accessible || false,
      error: data?.error
    };
  } catch (error) {
    console.error('Error checking SendGrid config:', error);
    return {
      configured: false,
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}