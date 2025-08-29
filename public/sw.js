// Service Worker pour gérer les tâches automatiques
console.log('🚀 GOJO Service Worker started');

// Configuration des tâches automatiques
const TASKS = {
  dailyEmailSummary: {
    name: 'Récapitulatifs quotidiens',
    time: '09:00', // 9h00 du matin
    days: [1, 2, 3, 4, 5], // Lundi à vendredi uniquement
    enabled: true
  }
};

// Stockage pour éviter les doublons
const LAST_EXECUTION_KEY = 'gojo_last_email_execution';

/**
 * Vérifie si on doit exécuter la tâche aujourd'hui
 */
function shouldExecuteToday(task) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=dimanche, 1=lundi, ..., 6=samedi
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Vérifier si c'est un jour de semaine (lundi-vendredi)
  if (!task.days.includes(dayOfWeek)) {
    console.log(`📅 Today is ${dayOfWeek} (weekend), skipping email task`);
    return false;
  }
  
  // Vérifier si c'est l'heure
  if (currentTime !== task.time) {
    return false;
  }
  
  // Vérifier si on a déjà exécuté aujourd'hui
  const today = now.toDateString();
  const lastExecution = localStorage.getItem(LAST_EXECUTION_KEY);
  
  if (lastExecution === today) {
    console.log(`✅ Already executed today (${today}), skipping`);
    return false;
  }
  
  return true;
}

/**
 * Exécute les tâches d'envoi d'emails
 */
async function executeDailyEmailTasks() {
  try {
    console.log('🚀 Executing daily email tasks...');
    
    const supabaseUrl = 'https://onuznsfzlkguvfdeilff.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9udXpuc2Z6bGtndXZmZGVpbGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTQyNzgsImV4cCI6MjA2MzU5MDI3OH0.Nmjfn7DDs36lIqs1pG33p7JaQ3aEmXr6WFqZBQPWqIE';
    
    const results = [];
    
    // 1. Récapitulatif AOs (9h00)
    try {
      console.log('📋 Calling RFP summary...');
      const rfpResponse = await fetch(`${supabaseUrl}/functions/v1/send-daily-rfp-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auto_trigger: true })
      });
      
      const rfpData = await rfpResponse.json();
      results.push({
        type: 'RFPs',
        success: rfpResponse.ok && rfpData.success,
        message: rfpData.message || 'OK',
        emailsSent: rfpData.emailsSent || 0
      });
    } catch (error) {
      results.push({
        type: 'RFPs',
        success: false,
        message: error.message
      });
    }
    
    // Petite pause entre les appels
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Récapitulatif Prospects (9h01)
    try {
      console.log('👥 Calling Prospects summary...');
      const prospectsResponse = await fetch(`${supabaseUrl}/functions/v1/send-daily-prospects-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auto_trigger: true })
      });
      
      const prospectsData = await prospectsResponse.json();
      results.push({
        type: 'Prospects',
        success: prospectsResponse.ok && prospectsData.success,
        message: prospectsData.message || 'OK',
        emailsSent: prospectsData.emailsSent || 0
      });
    } catch (error) {
      results.push({
        type: 'Prospects',
        success: false,
        message: error.message
      });
    }
    
    // Petite pause entre les appels
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Récapitulatif Besoins Clients (9h02)
    try {
      console.log('🎯 Calling Client Needs summary...');
      const clientNeedsResponse = await fetch(`${supabaseUrl}/functions/v1/send-daily-client-needs-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auto_trigger: true })
      });
      
      const clientNeedsData = await clientNeedsResponse.json();
      results.push({
        type: 'Client Needs',
        success: clientNeedsResponse.ok && clientNeedsData.success,
        message: clientNeedsData.message || 'OK',
        emailsSent: clientNeedsData.emailsSent || 0
      });
    } catch (error) {
      results.push({
        type: 'Client Needs',
        success: false,
        message: error.message
      });
    }
    
    // Marquer comme exécuté aujourd'hui
    const today = new Date().toDateString();
    localStorage.setItem(LAST_EXECUTION_KEY, today);
    
    console.log('✅ Daily email tasks completed:', results);
    
    // Envoyer les résultats à l'application principale si elle est ouverte
    if (self.clients) {
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'DAILY_EMAIL_EXECUTION',
          timestamp: new Date().toISOString(),
          results: results
        });
      });
    }
    
  } catch (error) {
    console.error('💥 Error executing daily email tasks:', error);
  }
}

/**
 * Timer principal - vérifie toutes les minutes
 */
function startCronTimer() {
  console.log('⏰ Starting cron timer (checks every minute)');
  
  setInterval(async () => {
    const now = new Date();
    const task = TASKS.dailyEmailSummary;
    
    // Log périodique (toutes les 30 minutes) pour debug
    if (now.getMinutes() === 0 || now.getMinutes() === 30) {
      console.log(`⏰ Cron check at ${now.toLocaleTimeString('fr-FR')} - Next execution: ${task.time} on weekdays`);
    }
    
    if (task.enabled && shouldExecuteToday(task)) {
      console.log(`🎯 Time to execute daily email tasks! (${now.toLocaleTimeString('fr-FR')})`);
      await executeDailyEmailTasks();
    }
  }, 60000); // Vérifier toutes les minutes
}

// Événements du Service Worker
self.addEventListener('install', (event) => {
  console.log('📦 GOJO Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🔄 GOJO Service Worker activated');
  event.waitUntil(self.clients.claim());
  
  // Démarrer le timer des tâches automatiques
  startCronTimer();
});

// Gérer les messages de l'application
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_CRON_STATUS') {
    console.log('💬 Status check requested');
    event.ports[0].postMessage({
      type: 'CRON_STATUS',
      enabled: TASKS.dailyEmailSummary.enabled,
      nextExecutionTime: TASKS.dailyEmailSummary.time,
      workingDays: 'Lundi à Vendredi',
      lastExecution: localStorage.getItem(LAST_EXECUTION_KEY)
    });
  }
  
  if (event.data && event.data.type === 'TOGGLE_CRON') {
    TASKS.dailyEmailSummary.enabled = event.data.enabled;
    console.log(`🔄 Cron tasks ${event.data.enabled ? 'enabled' : 'disabled'}`);
    
    event.ports[0].postMessage({
      type: 'CRON_TOGGLED',
      enabled: TASKS.dailyEmailSummary.enabled
    });
  }
});

console.log('✅ GOJO Service Worker ready for automatic email scheduling');