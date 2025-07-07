import React, { useState } from 'react';
import { Clock, Mail, Users, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { triggerDailyClientNeedsSummary, getDailyClientNeedsSummaryStats, checkClientNeedsCronStatus } from '../services/dailyClientNeedsSummary';
import type { DailyClientNeedsSummaryResult } from '../services/dailyClientNeedsSummary';

export function DailyClientNeedsSummaryTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DailyClientNeedsSummaryResult | null>(null);
  const [stats, setStats] = useState<Array<{
    salesRepCode: string;
    salesRepName: string;
    pendingClientNeeds: number;
  }> | null>(null);
  const [cronStatus, setCronStatus] = useState<{
    isConfigured: boolean;
    jobName: string;
    schedule: string;
    active: boolean;
    nextRun?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTriggerSummary = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null); 
    
    try {
      // Ajouter des données de test dans le localStorage pour simuler des profils
      const testData = salesReps.map(rep => ({
        id: `test-${rep.id}`,
        textContent: 'Profil de test pour le récapitulatif quotidien',
        fileName: 'cv-test.pdf',
        fileUrl: 'https://example.com/cv-test.pdf',
        fileContent: 'Contenu du CV de test',
        selectedNeedId: 'need-123',
        selectedNeedTitle: 'Développeur React - Client Test',
        availability: 'Immédiatement',
        dailyRate: 650,
        residence: 'Paris',
        mobility: 'France entière',
        phone: '06 12 34 56 78',
        email: 'test@example.com',
        status: 'À traiter',
        assignedTo: rep.id,
        isRead: false
      }));
      
      localStorage.setItem('clientNeeds', JSON.stringify(testData));
      console.log('Added test client needs to localStorage:', testData.length);
      
      const summaryResult = await triggerDailyClientNeedsSummary();
      setResult(summaryResult);
    } catch (err) {
      console.error('Error triggering client needs summary:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadStats = async () => {
    setError(null);
    
    // Récupérer les commerciaux pour les statistiques
    const { data: salesReps } = await supabase
      .from('sales_reps')
      .select('id, name, code, email')
      .order('code');
    
    if (salesReps && salesReps.length > 0) {
      // Ajouter des données de test dans le localStorage pour simuler des profils
      const testData = salesReps.map(rep => ({
        id: `test-${rep.id}`,
        textContent: 'Profil de test pour le récapitulatif quotidien',
        fileName: 'cv-test.pdf',
        fileUrl: 'https://example.com/cv-test.pdf',
        fileContent: 'Contenu du CV de test',
        selectedNeedId: 'need-123',
        selectedNeedTitle: 'Développeur React - Client Test',
        availability: 'Immédiatement',
        dailyRate: 650,
        residence: 'Paris',
        mobility: 'France entière',
        phone: '06 12 34 56 78',
        email: 'test@example.com',
        status: 'À traiter',
        assignedTo: rep.id,
        isRead: false
      }));
      
      localStorage.setItem('clientNeeds', JSON.stringify(testData));
      console.log('Added test client needs to localStorage for stats:', testData.length);
    }
    
    try {
      const statsResult = await getDailyClientNeedsSummaryStats();
      setStats(statsResult);
    } catch (err) {
      console.error('Error loading client needs stats:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques');
    }
  };

  const handleCheckCron = async () => {
    setError(null);
    
    try {
      const cronResult = await checkClientNeedsCronStatus();
      setCronStatus(cronResult);
    } catch (err) {
      console.error('Error checking client needs cron:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la vérification du cron');
    }
  };

  React.useEffect(() => {
    handleLoadStats();
    handleCheckCron();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Test du récapitulatif quotidien des profils pour besoins clients
        </h3>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleTriggerSummary}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {isLoading ? 'Envoi en cours...' : 'Déclencher l\'envoi manuel'}
            </button>
            
            <button
              onClick={handleLoadStats}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser les stats
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Récapitulatif des profils pour besoins clients envoyé avec succès
                  </h4>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    {result.emailsSent} email(s) envoyé(s) sur {result.totalSalesReps} commercial(aux)
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {result.results.map((res, index) => (
                  <div key={index} className="text-sm text-green-700 dark:text-green-300 flex items-center justify-between">
                    <span>{res.salesRep} ({res.email})</span>
                    <span className="flex items-center gap-2">
                      {res.emailSent ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {res.pendingClientNeeds} profil(s)
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          {res.reason || res.error || 'Erreur'}
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Statistiques profils pour besoins clients par commercial
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.salesRepCode} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {stat.salesRepCode}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.salesRepName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stat.pendingClientNeeds}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Profil{stat.pendingClientNeeds > 1 ? 's' : ''} à traiter
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statut du cron */}
      {cronStatus && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Configuration automatique profils pour besoins clients
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tâche programmée :</span>
              <span className={`px-2 py-1 rounded text-sm ${
                cronStatus.isConfigured 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
              }`}>
                {cronStatus.isConfigured ? 'Configurée' : 'Non configurée'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Horaire :</span>
              <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                Tous les jours à 9h02 (heure française)
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Statut :</span>
              <span className={`px-2 py-1 rounded text-sm ${
                cronStatus.active 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200'
              }`}>
                {cronStatus.active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}