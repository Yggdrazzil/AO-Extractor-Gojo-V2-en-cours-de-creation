import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TabContent } from './components/TabContent';
import { SettingsModal } from './components/SettingsModal';
import { analyzeRFP } from './services/openai';
import { createRFP, fetchRFPs, updateRFPStatus, updateRFPAssignee, updateRFPClient, updateRFPMission, updateRFPLocation, updateRFPMaxRate, updateRFPStartDate, updateRFPCreatedAt, deleteRFP } from './services/rfp';
import { markRFPAsRead } from './services/rfp';
import { createProspect, fetchProspects, updateProspectStatus, updateProspectAssignee, updateProspectDateUpdate, updateProspectAvailability, updateProspectDailyRate, updateProspectResidence, updateProspectMobility, updateProspectPhone, updateProspectEmail, deleteProspect, markProspectAsRead } from './services/prospects';
import { updateProspectTargetAccount } from './services/prospects';
import { ThemeProvider } from './context/ThemeContext';
import { supabase, checkSupabaseConnection } from './lib/supabase';
import { LoginForm } from './components/LoginForm';
import type { RFP, SalesRep, Prospect } from './types';
import type { Session } from '@supabase/supabase-js';
import { Settings } from 'lucide-react';

// Fonction pour récupérer les commerciaux
async function fetchSalesReps(): Promise<SalesRep[]> {
  console.log('Starting fetchSalesReps function...');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth check:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userId: session?.user?.id
    });

    if (!session) {
      console.warn('No active session, cannot fetch sales reps');
      return [];
    }

    console.log('Attempting to fetch from sales_reps table...');
    const { data: salesReps, error: salesRepsError } = await supabase
      .from('sales_reps')
      .select('id, code, name, created_at')
      .order('code');

    console.log('Supabase response:', {
      hasData: !!salesReps,
      dataLength: salesReps?.length,
      error: salesRepsError,
      firstRecord: salesReps?.[0]
    });

    if (salesRepsError) {
      console.error('Error fetching sales reps:', salesRepsError);
      // Ne pas lancer d'erreur si c'est juste un problème d'autorisation
      if (salesRepsError.code === 'PGRST301' || salesRepsError.code === '42501') {
        console.warn('Authorization issue, returning empty array');
        return [];
      }
      throw salesRepsError;
    }

    return salesReps || [];
  } catch (error) {
    console.error('Failed to fetch sales reps:', error);
    // Retourner un tableau vide plutôt que de lancer une erreur
    return [];
  }
}

function App() {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingProspect, setIsAnalyzingProspect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('rfp-extractor');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Vérifier la connexion Supabase
        const connected = await checkSupabaseConnection();
        setIsConnected(connected);
        
        // Récupérer la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          // Ne pas traiter les erreurs de session comme des erreurs fatales
        }
        
        setSession(session);
        console.log('App initialized:', { connected, hasSession: !!session });
        
      } catch (err) {
        console.error('Erreur d\'initialisation:', err);
        // Ne pas afficher d'erreur si c'est juste un problème d'auth
        if (err instanceof Error && !err.message.includes('auth')) {
          setError('Une erreur est survenue lors de l\'initialisation de l\'application.');
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    initializeApp();

    // Écouter les changements d'état d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session);
      setSession(session);
      
      if (event === 'SIGNED_IN' && session) {
        // Recharger les données après connexion
        setError(null);
        loadInitialData(session);
      } else if (event === 'SIGNED_OUT') {
        // Nettoyer les données après déconnexion
        setRfps([]);
        setSalesReps([]);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadInitialData = async (currentSession?: Session | null) => {
    try {
      console.log('Loading initial data...');
      setIsLoading(true);
      setError(null);

      const activeSession = currentSession || session;
      
      if (activeSession && isConnected) {
        try {
          // Charger d'abord les commerciaux
          console.log('Loading sales reps...');
          const salesRepsData = await fetchSalesReps();
          console.log('Sales reps loaded:', { count: salesRepsData.length });
          setSalesReps(salesRepsData);

          // Puis charger les AOs
          console.log('Loading RFPs...');
          const rfpsData = await fetchRFPs();
          console.log('RFPs loaded:', { count: rfpsData.length });
          setRfps(rfpsData);

          // Charger les prospects
          console.log('Loading prospects...');
          const prospectsData = await fetchProspects();
          console.log('Prospects loaded:', { count: prospectsData.length });
          setProspects(prospectsData);
          
        } catch (err) {
          console.error('Error loading data:', err);
          
          // Gérer différents types d'erreurs
          if (err instanceof Error) {
            if (err.message.includes('Authentication required') || 
                err.message.includes('Session expirée')) {
              setError('Votre session a expiré. Veuillez vous reconnecter.');
            } else if (err.message.includes('PGRST301') || 
                       err.message.includes('42501')) {
              setError('Problème d\'autorisation. Vérifiez vos permissions.');
            } else {
              setError('Erreur lors du chargement des données. Veuillez réessayer.');
            }
          } else {
            setError('Une erreur inattendue est survenue.');
          }
        }
      } else {
        console.log('Skipping data load - not connected or not authenticated', { 
          isConnected, 
          hasSession: !!activeSession 
        });
      }
    } catch (error) {
      console.error('Failed to load initial data. Error:', error);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données quand la session et la connexion sont prêtes
  useEffect(() => {
    if (isConnected && session && !isLoading) {
      console.log('Starting data load - connected and authenticated');
      loadInitialData();
    }
  }, [session, isConnected]);

  // Affichage de l'état de chargement initial
  if (isLoading && !session) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Erreur</h1>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setError(null);
                    loadInitialData();
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réessayer
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Recharger la page
                </button>
              </div>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  const handleAnalyzeRFP = async (content: string, assignedTo: string) => {
    setIsAnalyzing(true);
    try {
      const selectedRep = salesReps.find(rep => rep.id === assignedTo);

      if (!content.trim()) {
        throw new Error("Le contenu de l'AO ne peut pas être vide");
      }
      if (!selectedRep) {
        throw new Error("Veuillez sélectionner un commercial valide");
      }

      const analysis = await analyzeRFP(content);
      const newRFP = await createRFP({
        ...analysis,
        client: analysis.client,
        mission: analysis.mission,
        location: analysis.location,
        maxRate: analysis.maxRate,
        createdAt: analysis.createdAt,
        startDate: analysis.startDate,
        status: 'À traiter',
        assignedTo,
        content
      });

      setRfps((prev) => [newRFP, ...prev]);
    } catch (error) {
      console.error('Failed to analyze RFP:', error);
      alert((error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStatusChange = async (id: string, status: RFP['status']) => {
    try {
      await updateRFPStatus(id, status);
      setRfps((prev) =>
        prev.map((rfp) => (rfp.id === id ? { ...rfp, status } : rfp))
      );
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAssigneeChange = async (id: string, assignedTo: string) => {
    try {
      await updateRFPAssignee(id, assignedTo);
      setRfps((prev) =>
        prev.map((rfp) => (rfp.id === id ? { ...rfp, assignedTo } : rfp))
      );
    } catch (error) {
      console.error('Failed to update assignee:', error);
    }
  };

  const handleClientChange = async (id: string, client: string) => {
    try {
      await updateRFPClient(id, client);
      setRfps(prev => prev.map(rfp => rfp.id === id ? { ...rfp, client } : rfp));
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  };

  const handleMissionChange = async (id: string, mission: string) => {
    try {
      await updateRFPMission(id, mission);
      setRfps(prev => prev.map(rfp => rfp.id === id ? { ...rfp, mission } : rfp));
    } catch (error) {
      console.error('Failed to update mission:', error);
    }
  };

  const handleLocationChange = async (id: string, location: string) => {
    try {
      await updateRFPLocation(id, location);
      setRfps(prev => prev.map(rfp => rfp.id === id ? { ...rfp, location } : rfp));
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const handleMaxRateChange = async (id: string, maxRate: string) => {
    try {
      const numericRate = maxRate ? parseInt(maxRate, 10) : null;
      await updateRFPMaxRate(id, numericRate);
      setRfps(prev => prev.map(rfp => rfp.id === id ? { ...rfp, maxRate: numericRate } : rfp));
    } catch (error) {
      console.error('Failed to update max rate:', error);
      alert('Erreur lors de la mise à jour du TJM');
    }
  };

  const handleStartDateChange = async (id: string, startDate: string) => {
    try {
      await updateRFPStartDate(id, startDate);
      const updatedRfps = prev => prev.map(rfp => {
        if (rfp.id === id) {
          return { ...rfp, startDate };
        }
        return rfp;
      });
      setRfps(updatedRfps);
    } catch (error) {
      console.error('Failed to update start date:', error);
      alert('Erreur lors de la mise à jour de la date de démarrage');
    }
  };

  const handleCreatedAtChange = async (id: string, createdAt: string) => {
    try {
      await updateRFPCreatedAt(id, createdAt);
      const updatedRfps = prev => prev.map(rfp => {
        if (rfp.id === id) {
          return { ...rfp, createdAt };
        }
        return rfp;
      });
      setRfps(updatedRfps);
    } catch (error) {
      console.error('Failed to update creation date:', error);
      alert('Erreur lors de la mise à jour de la date de création');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRFP(id);
      setRfps(prev => prev.filter(rfp => rfp.id !== id));
    } catch (error) {
      console.error('Failed to delete RFP:', error);
    }
  };

  const handleViewRFP = async (rfp: RFP) => {
    // Marquer l'AO comme lu quand on l'ouvre
    if (!rfp.isRead) {
      try {
        await markRFPAsRead(rfp.id);
        setRfps(prev => prev.map(r => r.id === rfp.id ? { ...r, isRead: true } : r));
      } catch (error) {
        console.error('Failed to mark RFP as read:', error);
      }
    }
    console.log('Viewing RFP:', rfp.id);
  };

  const handleAnalyzeProspect = async (textContent: string, targetAccount: string, file: File | null, assignedTo: string) => {
    setIsAnalyzingProspect(true);
    try {
      const selectedRep = salesReps.find(rep => rep.id === assignedTo);

      if (!textContent.trim() && !file) {
        throw new Error("Veuillez saisir du texte ou joindre un fichier");
      }
      if (!selectedRep) {
        throw new Error("Veuillez sélectionner un commercial valide");
      }

      // Analyser le contenu textuel avec l'IA si disponible
      let analysisResult = {};
      if (textContent.trim()) {
        try {
          analysisResult = await analyzeProspect(textContent);
          console.log('Prospect analysis result:', analysisResult);
        } catch (analysisError) {
          console.error('Error analyzing prospect:', analysisError);
          // Continuer avec des valeurs par défaut si l'analyse échoue
        }
      }

      const newProspect = await createProspect({
        textContent: textContent || '',
        fileName: file?.name || null,
        fileUrl: null, // TODO: Upload du fichier
        targetAccount: targetAccount || '',
        availability: analysisResult.availability || 'À définir',
        dailyRate: analysisResult.dailyRate || null,
        residence: analysisResult.residence || 'À définir',
        mobility: analysisResult.mobility || 'À définir',
        phone: analysisResult.phone || 'À définir',
        email: analysisResult.email || 'À définir',
        status: 'À traiter',
        assignedTo,
        isRead: false
      });

      setProspects((prev) => [newProspect, ...prev]);
    } catch (error) {
      console.error('Failed to analyze prospect:', error);
      alert((error as Error).message);
    } finally {
      setIsAnalyzingProspect(false);
    }
  };

  const handleProspectStatusChange = async (id: string, status: Prospect['status']) => {
    try {
      await updateProspectStatus(id, status);
      setProspects((prev) =>
        prev.map((prospect) => (prospect.id === id ? { ...prospect, status } : prospect))
      );
    } catch (error) {
      console.error('Failed to update prospect status:', error);
    }
  };

  const handleProspectAssigneeChange = async (id: string, assignedTo: string) => {
    try {
      await updateProspectAssignee(id, assignedTo);
      setProspects((prev) =>
        prev.map((prospect) => (prospect.id === id ? { ...prospect, assignedTo } : prospect))
      );
    } catch (error) {
      console.error('Failed to update prospect assignee:', error);
    }
  };

  const handleProspectTargetAccountChange = async (id: string, targetAccount: string) => {
    try {
      await updateProspectTargetAccount(id, targetAccount);
      setProspects(prev => prev.map(prospect => prospect.id === id ? { ...prospect, targetAccount } : prospect));
    } catch (error) {
      console.error('Failed to update prospect target account:', error);
    }
  };

  const handleProspectAvailabilityChange = async (id: string, availability: string) => {
    try {
      await updateProspectAvailability(id, availability);
      setProspects(prev => prev.map(prospect => prospect.id === id ? { ...prospect, availability } : prospect));
    } catch (error) {
      console.error('Failed to update prospect availability:', error);
    }
  };

  const handleProspectDailyRateChange = async (id: string, dailyRate: string) => {
    try {
      const numericRate = dailyRate ? parseInt(dailyRate, 10) : null;
      await updateProspectDailyRate(id, numericRate);
      setProspects(prev => prev.map(prospect => prospect.id === id ? { ...prospect, dailyRate: numericRate } : prospect));
    } catch (error) {
      console.error('Failed to update prospect daily rate:', error);
      alert('Erreur lors de la mise à jour du TJM');
    }
  };

  const handleProspectResidenceChange = async (id: string, residence: string) => {
    try {
      await updateProspectResidence(id, residence);
      setProspects(prev => prev.map(prospect => prospect.id === id ? { ...prospect, residence } : prospect));
    } catch (error) {
      console.error('Failed to update prospect residence:', error);
    }
  };

  const handleProspectMobilityChange = async (id: string, mobility: string) => {
    try {
      await updateProspectMobility(id, mobility);
      setProspects(prev => prev.map(prospect => prospect.id === id ? { ...prospect, mobility } : prospect));
    } catch (error) {
      console.error('Failed to update prospect mobility:', error);
    }
  };

  const handleProspectPhoneChange = async (id: string, phone: string) => {
    try {
      await updateProspectPhone(id, phone);
      setProspects(prev => prev.map(prospect => prospect.id === id ? { ...prospect, phone } : prospect));
    } catch (error) {
      console.error('Failed to update prospect phone:', error);
    }
  };

  const handleProspectEmailChange = async (id: string, email: string) => {
    try {
      await updateProspectEmail(id, email);
      setProspects(prev => prev.map(prospect => prospect.id === id ? { ...prospect, email } : prospect));
    } catch (error) {
      console.error('Failed to update prospect email:', error);
    }
  };

  const handleProspectDelete = async (id: string) => {
    try {
      await deleteProspect(id);
      setProspects(prev => prev.filter(prospect => prospect.id !== id));
    } catch (error) {
      console.error('Failed to delete prospect:', error);
    }
  };

  const handleViewProspect = async (prospect: Prospect) => {
    // Marquer le prospect comme lu quand on l'ouvre
    if (!prospect.isRead) {
      try {
        await markProspectAsRead(prospect.id);
        setProspects(prev => prev.map(p => p.id === prospect.id ? { ...p, isRead: true } : p));
      } catch (error) {
        console.error('Failed to mark prospect as read:', error);
      }
    }
    console.log('Viewing prospect:', prospect.id);
  };

  if (!session) {
    return (
      <ThemeProvider>
        <LoginForm />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          rfps={rfps}
          prospects={prospects}
        />
        <div className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'rfp-extractor' ? 'Extracteur d\'AO' : 
               activeTab === 'rfp-list' ? 'Liste des AO' :
               activeTab === 'prospects-extractor' ? 'Extracteur de Prospects' :
               'Liste des Prospects'}
            </h1>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Paramètres"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <TabContent
              activeTab={activeTab}
              rfps={rfps}
              prospects={prospects}
              salesReps={salesReps}
              isAnalyzing={isAnalyzing}
              isAnalyzingProspect={isAnalyzingProspect}
              onAnalyzeRFP={handleAnalyzeRFP}
              onAnalyzeProspect={handleAnalyzeProspect}
              onStatusChange={handleStatusChange}
              onAssigneeChange={handleAssigneeChange}
              onClientChange={handleClientChange}
              onMissionChange={handleMissionChange}
              onLocationChange={handleLocationChange}
              onMaxRateChange={handleMaxRateChange}
              onStartDateChange={handleStartDateChange}
              onCreatedAtChange={handleCreatedAtChange}
              onDelete={handleDelete}
              onView={handleViewRFP}
              onProspectStatusChange={handleProspectStatusChange}
              onProspectAssigneeChange={handleProspectAssigneeChange}
              onProspectTargetAccountChange={handleProspectTargetAccountChange}
              onProspectAvailabilityChange={handleProspectAvailabilityChange}
              onProspectDailyRateChange={handleProspectDailyRateChange}
              onProspectResidenceChange={handleProspectResidenceChange}
              onProspectMobilityChange={handleProspectMobilityChange}
              onProspectPhoneChange={handleProspectPhoneChange}
              onProspectEmailChange={handleProspectEmailChange}
              onProspectDelete={handleProspectDelete}
              onProspectView={handleViewProspect}
            />
          </div>
        </div>
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;