/**
 * Service pour gérer les tâches automatiques côté client
 * Alternative aux cron jobs serveur qui ne fonctionnent pas sur Supabase hébergé
 */

interface CronStatus {
  enabled: boolean;
  nextExecutionTime: string;
  workingDays: string;
  lastExecution: string | null;
  serviceWorkerActive: boolean;
}

interface ExecutionResult {
  type: string;
  success: boolean;
  message: string;
  emailsSent?: number;
}

/**
 * Initialise le système de tâches automatiques côté client
 */
export async function initializeClientSideCron(): Promise<boolean> {
  try {
    console.log('🚀 Initializing client-side cron system...');
    
    // Vérifier si les Service Workers sont supportés
    if (!('serviceWorker' in navigator)) {
      console.error('❌ Service Workers not supported in this browser');
      return false;
    }
    
    // Enregistrer le Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker registered successfully');
    
    // Attendre qu'il soit actif
    if (registration.installing) {
      console.log('📦 Service Worker installing...');
      await new Promise((resolve) => {
        registration.installing!.addEventListener('statechange', () => {
          if (registration.installing!.state === 'installed') {
            resolve(void 0);
          }
        });
      });
    }
    
    if (registration.waiting) {
      console.log('⏳ Service Worker waiting...');
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    
    if (registration.active) {
      console.log('🎯 Service Worker is active and ready for cron tasks');
    }
    
    // Écouter les messages du Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'DAILY_EMAIL_EXECUTION') {
        console.log('📧 Daily email execution completed:', event.data.results);
        
        // Afficher une notification à l'utilisateur si l'application est ouverte
        showExecutionNotification(event.data.results);
      }
    });
    
    return true;
  } catch (error) {
    console.error('💥 Failed to initialize client-side cron:', error);
    return false;
  }
}

/**
 * Vérifie le statut des tâches automatiques
 */
export async function checkCronStatus(): Promise<CronStatus> {
  try {
    if (!navigator.serviceWorker.controller) {
      return {
        enabled: false,
        nextExecutionTime: '9h00',
        workingDays: 'Lundi à Vendredi',
        lastExecution: null,
        serviceWorkerActive: false
      };
    }
    
    // Demander le statut au Service Worker
    const messageChannel = new MessageChannel();
    
    const response = await new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CHECK_CRON_STATUS' },
        [messageChannel.port2]
      );
      
      // Timeout après 3 secondes
      setTimeout(() => {
        resolve({
          enabled: false,
          nextExecutionTime: '9h00',
          workingDays: 'Lundi à Vendredi',
          lastExecution: null
        });
      }, 3000);
    }) as any;
    
    return {
      ...response,
      serviceWorkerActive: true
    };
  } catch (error) {
    console.error('Error checking cron status:', error);
    return {
      enabled: false,
      nextExecutionTime: '9h00',
      workingDays: 'Lundi à Vendredi',
      lastExecution: null,
      serviceWorkerActive: false
    };
  }
}

/**
 * Active ou désactive les tâches automatiques
 */
export async function toggleCronTasks(enabled: boolean): Promise<boolean> {
  try {
    if (!navigator.serviceWorker.controller) {
      return false;
    }
    
    const messageChannel = new MessageChannel();
    
    const response = await new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      navigator.serviceWorker.controller!.postMessage(
        { type: 'TOGGLE_CRON', enabled },
        [messageChannel.port2]
      );
      
      setTimeout(() => resolve({ enabled: false }), 3000);
    }) as any;
    
    return response.enabled === enabled;
  } catch (error) {
    console.error('Error toggling cron tasks:', error);
    return false;
  }
}

/**
 * Affiche une notification des résultats d'exécution
 */
function showExecutionNotification(results: ExecutionResult[]) {
  const totalEmails = results.reduce((sum, r) => sum + (r.emailsSent || 0), 0);
  const successCount = results.filter(r => r.success).length;
  
  console.log(`📧 Automatic email execution: ${successCount}/${results.length} successful, ${totalEmails} emails sent`);
  
  // Créer une notification visible dans l'interface si possible
  if (typeof window !== 'undefined') {
    // Essayer de créer une notification système
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('GOJO - Récapitulatifs envoyés', {
        body: `${totalEmails} email(s) de récapitulatif envoyé(s) automatiquement`,
        icon: '/image.png'
      });
    }
    
    // Sauvegarder dans le localStorage pour l'affichage dans l'interface
    localStorage.setItem('gojo_last_execution_result', JSON.stringify({
      timestamp: new Date().toISOString(),
      results: results,
      totalEmails: totalEmails
    }));
  }
}

/**
 * Récupère le dernier résultat d'exécution
 */
export function getLastExecutionResult(): { timestamp: string; results: ExecutionResult[]; totalEmails: number } | null {
  try {
    const stored = localStorage.getItem('gojo_last_execution_result');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting last execution result:', error);
    return null;
  }
}

/**
 * Demande la permission pour les notifications
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}