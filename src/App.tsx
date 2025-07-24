import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TabContent } from './components/TabContent';
import { SettingsModal } from './components/SettingsModal';
import { analyzeRFP, analyzeProspect } from './services/openai';
import { createRFP, fetchRFPs, updateRFPStatus, updateRFPAssignee, updateRFPClient, updateRFPMission, updateRFPLocation, updateRFPMaxRate, updateRFPStartDate, updateRFPCreatedAt, deleteRFP } from './services/rfp';
import { updateRFPComments } from './services/rfp';
import { markRFPAsRead } from './services/rfp';
import { fetchClientNeeds, addClientNeed, updateClientNeedStatus, updateClientNeedAssignee, updateClientNeedSelectedNeed, updateClientNeedAvailability, updateClientNeedDailyRate, updateClientNeedResidence, updateClientNeedMobility, updateClientNeedPhone, updateClientNeedEmail, deleteClientNeed, markClientNeedAsRead } from './services/clientNeeds';
import { extractFileContent } from './services/fileUpload';
import { sendRFPNotification } from './services/emailNotification';
import { sendClientNeedNotification, getSalesRepCode } from './services/clientNeedNotification';
import { createProspect, fetchProspects, updateProspectStatus, updateProspectAssignee, updateProspectDateUpdate, updateProspectAvailability, updateProspectDailyRate, updateProspectResidence, updateProspectMobility, updateProspectPhone, updateProspectEmail, deleteProspect, markProspectAsRead } from './services/prospects';
import { updateProspectTargetAccount } from './services/prospects';
import { updateProspectComments } from './services/prospects';
import { updateClientNeedComments } from './services/clientNeeds';
import { ThemeProvider } from './context/ThemeContext';
import { supabase, checkSupabaseConnection } from './lib/supabase';
import { LoginForm } from './components/LoginForm';
import type { RFP, SalesRep, Prospect, BoondmanagerProspect } from './types';
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
      .select('id, code, name, email, is_admin, created_at')
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
  const [boondmanagerProspects, setBoondmanagerProspects] = useState<BoondmanagerProspect[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingProspect, setIsAnalyzingProspect] = useState(false);
  const [isAnalyzingBoondmanagerProspect, setIsAnalyzingBoondmanagerProspect] = useState(false);
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

  // Charger les données des besoins clients au démarrage
  useEffect(() => {
    const loadClientNeeds = async () => {
      try {
        if (session && isConnected) {
          const clientNeedsData = await fetchClientNeeds();
          setBoondmanagerProspects(clientNeedsData);
        }
      } catch (error) {
        console.error('Error loading client needs:', error);
      }
    };
    
    loadClientNeeds();
  }, [session, isConnected]);

  const handleLoginSuccess = (session: Session) => {
    setSession(session);
    setError(null);
    loadInitialData(session);
  };

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
        client: analysis.client || 'Non spécifié',
        mission: analysis.mission || 'Non spécifié',
        location: analysis.location || 'Non spécifié',
        maxRate: analysis.maxRate || null,
        createdAt: analysis.createdAt || null,
        startDate: analysis.startDate || null,
        status: 'À traiter',
        assignedTo,
        content,
        isRead: false
      });

      // Envoi de la notification email (non bloquant)
      try {
        const salesRepCode = await getSalesRepCode(assignedTo);
        if (salesRepCode) {
          // Programmer l'envoi avec un délai de 30 secondes
          const emailScheduled = await sendRFPNotification({
            rfpId: newRFP.id,
            client: newRFP.client,
            mission: newRFP.mission,
            location: newRFP.location,
            salesRepCode,
            assignedTo
          }, 0.5); // 30 secondes de délai (0.5 minute)
          
          if (emailScheduled) {
            console.log('Email notification scheduled successfully (will be sent in 30 seconds)');
          } else {
            console.log('Email notification could not be scheduled');
          }
        } else {
          console.warn('Could not send email: sales rep code not found');
        }
      } catch (emailError) {
        console.warn('Email notification scheduling failed (non-blocking):', emailError);
      }
      
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

  const handleCommentsChange = async (id: string, comments: string) => {
    try {
      console.log('🔄 App.tsx handleCommentsChange called:', { id, comments: comments.substring(0, 50) + '...' });
      await updateRFPComments(id, comments);
      console.log('✅ updateRFPComments completed, updating local state...');
      setRfps(prev => prev.map(rfp => rfp.id === id ? { ...rfp, comments } : rfp));
      console.log('✅ Local state updated');
    } catch (error) {
      console.error('Failed to update comments:', error);
      alert('Erreur lors de la mise à jour des commentaires');
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

      // Extraire le contenu du fichier si présent
      let cvContent = undefined;
      if (file) {
        try {
          cvContent = await extractFileContent(file);
          console.log('File content extracted:', cvContent ? 'Success' : 'Failed');
        } catch (fileError) {
          console.error('Error extracting file content:', fileError);
          // Continuer sans le contenu du fichier
        }
      }

      // Analyser le contenu avec l'IA si on a du contenu à analyser
      let analysisResult = {};
      if (textContent.trim() || cvContent) {
        try {
          analysisResult = await analyzeProspect(textContent.trim(), cvContent);
          console.log('Prospect analysis result:', analysisResult);
        } catch (analysisError) {
          console.error('Error analyzing prospect:', analysisError);
          // Continuer avec des valeurs par défaut si l'analyse échoue
          analysisResult = {
            availability: 'À définir',
            dailyRate: null,
            residence: 'À définir',
            mobility: 'À définir',
            phone: 'À définir',
            email: 'À définir'
          };
        }
      } else {
        // Valeurs par défaut si pas de contenu à analyser
        analysisResult = {
          availability: 'À définir',
          dailyRate: null,
          residence: 'À définir',
          mobility: 'À définir',
          phone: 'À définir',
          email: 'À définir'
        };
      }

      const newProspect = await createProspect({
        textContent: textContent || '',
        fileName: file?.name || null,
        fileUrl: null, // TODO: Upload du fichier
        fileContent: cvContent || null,
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
      }, file);

      setProspects((prev) => [newProspect, ...prev]);
    } catch (error) {
      console.error('Failed to analyze prospect:', error);
      alert((error as Error).message);
    } finally {
      setIsAnalyzingProspect(false);
    }
  };

  const handleAnalyzeBoondmanagerProspect = async (textContent: string, selectedNeedId: string, selectedNeedTitle: string, file: File | null, assignedTo: string) => {
    setIsAnalyzingBoondmanagerProspect(true);
    try {
      const selectedRep = salesReps.find(rep => rep.id === assignedTo);

      if (!textContent.trim() && !file) {
        throw new Error("Veuillez saisir du texte ou joindre un fichier");
      }
      if (!selectedNeedId.trim()) {
        throw new Error("Veuillez saisir un besoin");
      }
      if (!selectedRep) {
        throw new Error("Veuillez sélectionner un commercial valide");
      }

      // Extraire le contenu du fichier si présent
      let fileUrl = undefined;
      let fileName = file?.name;
      let fileContent = undefined;
      
      if (file) {
        try {
          const { uploadFile } = await import('./services/fileUpload');
          const uploadResult = await uploadFile(file, 'cvs');
          fileUrl = uploadResult.url;
          fileContent = uploadResult.content;
          console.log('File uploaded successfully:', { url: fileUrl, content: fileContent?.substring(0, 100) + '...' });
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
        }
      }

      // Analyser le contenu avec l'IA si on a du contenu à analyser
      let analysisResult = {
        availability: '-',
        dailyRate: null,
        salaryExpectations: null,
        residence: '-',
        mobility: '-',
        phone: '-',
        email: '-'
      };
      
      if (textContent.trim() || fileContent) {
        try {
          analysisResult = await analyzeProspect(textContent.trim(), fileContent);
          console.log('Client needs analysis result:', analysisResult);
        } catch (analysisError) {
          console.error('Error analyzing client needs:', analysisError);
        }
      }

      // Créer le profil dans la base de données
      try {
        const newBoondmanagerProspect = await addClientNeed({
          textContent: textContent || '',
          fileName: fileName || undefined,
          fileUrl: fileUrl,
          fileContent: fileContent,
          selectedNeedId,
          selectedNeedTitle,
          availability: analysisResult.availability,
          dailyRate: analysisResult.dailyRate,
          salaryExpectations: analysisResult.salaryExpectations,
          residence: analysisResult.residence,
          mobility: analysisResult.mobility,
          phone: analysisResult.phone,
          email: analysisResult.email,
          status: 'À traiter',
          assignedTo,
          isRead: false
        });

        setBoondmanagerProspects((prev) => [newBoondmanagerProspect, ...prev]);
        console.log('Client need created and saved:', newBoondmanagerProspect.id);
      } catch (saveError) {
        console.error('Error saving client need:', saveError);
      }
    } catch (error) {
      console.error('Failed to analyze Boondmanager prospect:', error);
      alert((error as Error).message);
    } finally {
      setIsAnalyzingBoondmanagerProspect(false);
    }
  };

  const handleClientNeedStatusChange = async (id: string, status: BoondmanagerProspect['status']) => {
    try {
      await updateClientNeedStatus(id, status);
      setBoondmanagerProspects((prev) =>
        prev.map((prospect) => (prospect.id === id ? { ...prospect, status } : prospect))
      );
    } catch (error) {
      console.error('Failed to update client need status:', error);
    }
  };

  const handleClientNeedAssigneeChange = async (id: string, assignedTo: string) => {
    try {
      await updateClientNeedAssignee(id, assignedTo);
      setBoondmanagerProspects((prev) =>
        prev.map((prospect) => (prospect.id === id ? { ...prospect, assignedTo } : prospect))
      );
    } catch (error) {
      console.error('Failed to update client need assignee:', error);
    }
  };

  const handleClientNeedSelectedNeedChange = async (id: string, selectedNeedTitle: string) => {
    try {
      await updateClientNeedSelectedNeed(id, selectedNeedTitle);
      setBoondmanagerProspects((prev) =>
        prev.map((prospect) => (prospect.id === id ? { ...prospect, selectedNeedTitle } : prospect))
      );
    } catch (error) {
      console.error('Failed to update client need selected need:', error);
    }
  };

  const handleClientNeedAvailabilityChange = async (id: string, availability: string) => {
    try {
      await updateClientNeedAvailability(id, availability);
      setBoondmanagerProspects((prev) =>
        prev.map((prospect) => (prospect.id === id ? { ...prospect, availability } : prospect))
      );
    } catch (error) {
      console.error('Failed to update client need availability:', error);
    }
  };

  const handleClientNeedDailyRateChange = async (id: string, dailyRate: string) => {
    try {
      const numericRate = dailyRate ? parseInt(dailyRate, 10) : null;
      await updateClientNeedDailyRate(id, numericRate);
      setBoondmanagerProspects((prev) =>
        prev.map((prospect) => (prospect.id === id ? { ...prospect, dailyRate: numericRate } : prospect))
      );
    } catch (error) {
      console.error('Failed to update client need daily rate:', error);
    }
  };

  const handleClientNeedResidenceChange = async (id: string, residence: string) => {
    try {
      await updateClientNeedResidence(id, residence);
      setBoondmanagerProspects((prev) =>
        prev.map((prospect) => (prospect.id === id ? { ...prospect, residence } : prospect))
      );
    } catch (error) {
      console.error('Failed to update client need residence:', error);
    }
  };

  const handleClientNeedMobilityChange = async (id: string, mobility: string) => {
    try {
      await updateClientNeedMobility(id, mobility);
      setBoondmanagerProspects((prev) =>
        prev.map((prospect) => (prospect.id === id ? { ...prospect, mobility } : prospect))
      );
    } catch (error) {
      console.error('Failed to update client need mobility:', error);
    }
  };

  const handleClientNeedPhoneChange = async (id: string, phone: string) => {
    try {
      await updateClientNeedPhone(id, phone);
      setBoondmanagerProspects((prev) =>
        prev.map((prospect) => (prospect.id === id ? { ...prospect, phone } : prospect))
      );
    } catch (error) {
      console.error('Failed to update client need phone:', error);
    }
  };

  const handleClientNeedEmailChange = async (id: string, email: string) => {
    try {
      await updateClientNeedEmail(id, email);
      setBoondmanagerProspects((prev) =>
        prev.map((prospect) => (prospect.id === id ? { ...prospect, email } : prospect))
      );
    } catch (error) {
      console.error('Failed to update client need email:', error);
    }
  };

  const handleClientNeedCommentsChange = async (id: string, comments: string) => {
    try {
      console.log('🔄 App.tsx handleClientNeedCommentsChange called:', { id, comments: comments.substring(0, 50) + '...' });
      await updateClientNeedComments(id, comments);
      console.log('✅ updateClientNeedComments completed, updating local state...');
      setBoondmanagerProspects(prev => prev.map(prospect => prospect.id === id ? { ...prospect, comments } : prospect));
      console.log('✅ Client need local state updated');
    } catch (error) {
      console.error('Failed to update client need comments:', error);
      alert('Erreur lors de la mise à jour des commentaires');
    }
  };

  const handleClientNeedDelete = async (id: string) => {
    try {
      await deleteClientNeed(id);
      setBoondmanagerProspects((prev) => prev.filter((prospect) => prospect.id !== id));
    } catch (error) {
      console.error('Failed to delete client need:', error);
    }
  };

  const handleClientNeedView = async (prospect: BoondmanagerProspect) => {
    if (!prospect.isRead) {
      try {
        await markClientNeedAsRead(prospect.id);
        setBoondmanagerProspects((prev) =>
          prev.map((p) => (p.id === prospect.id ? { ...p, isRead: true } : p))
        );
      } catch (error) {
        console.error('Failed to mark client need as read:', error);
      }
    }
    console.log('Viewing client need:', prospect.id);
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

  const handleProspectCommentsChange = async (id: string, comments: string) => {
    try {
      console.log('🔄 App.tsx handleProspectCommentsChange called:', { id, comments: comments.substring(0, 50) + '...' });
      await updateProspectComments(id, comments);
      console.log('✅ updateProspectComments completed, updating local state...');
      setProspects(prev => prev.map(prospect => prospect.id === id ? { ...prospect, comments } : prospect));
      console.log('✅ Prospect local state updated');
    } catch (error) {
      console.error('Failed to update prospect comments:', error);
      alert('Erreur lors de la mise à jour des commentaires');
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
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex flex-col lg:flex-row h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          rfps={rfps}
          prospects={prospects}
          boondmanagerProspects={boondmanagerProspects}
        />
        <div className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'rfp-extractor' ? 'Extracteur d\'AO' : 
               activeTab === 'rfp-list' ? 'Liste des AO' :
               activeTab === 'prospects-extractor' ? 'Extracteur de Prospects' :
               activeTab === 'boondmanager-prospects' ? 'Profils pour besoins clients' :
               'Profils pour Prise de Références'}
            </h1>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="self-end sm:self-auto p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
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
              boondmanagerProspects={boondmanagerProspects}
              salesReps={salesReps}
              isAnalyzing={isAnalyzing}
              isAnalyzingProspect={isAnalyzingProspect}
              isAnalyzingBoondmanagerProspect={isAnalyzingBoondmanagerProspect}
              onAnalyzeRFP={handleAnalyzeRFP}
              onAnalyzeProspect={handleAnalyzeProspect}
              onAnalyzeBoondmanagerProspect={handleAnalyzeBoondmanagerProspect}
              onStatusChange={handleStatusChange}
              onAssigneeChange={handleAssigneeChange}
              onClientChange={handleClientChange}
              onMissionChange={handleMissionChange}
              onLocationChange={handleLocationChange}
              onMaxRateChange={handleMaxRateChange}
              onStartDateChange={handleStartDateChange}
              onCreatedAtChange={handleCreatedAtChange}
              onCommentsChange={handleCommentsChange}
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
              onProspectCommentsChange={handleProspectCommentsChange}
              onBoondmanagerProspectStatusChange={handleClientNeedStatusChange}
              onBoondmanagerProspectAssigneeChange={handleClientNeedAssigneeChange}
              onBoondmanagerProspectSelectedNeedChange={handleClientNeedSelectedNeedChange}
              onBoondmanagerProspectAvailabilityChange={handleClientNeedAvailabilityChange}
              onBoondmanagerProspectDailyRateChange={handleClientNeedDailyRateChange}
              onBoondmanagerProspectResidenceChange={handleClientNeedResidenceChange}
              onBoondmanagerProspectMobilityChange={handleClientNeedMobilityChange}
              onBoondmanagerProspectPhoneChange={handleClientNeedPhoneChange}
              onBoondmanagerProspectEmailChange={handleClientNeedEmailChange}
              onBoondmanagerProspectView={handleClientNeedView}
              onBoondmanagerProspectDelete={handleClientNeedDelete}
              onBoondmanagerProspectCommentsChange={handleClientNeedCommentsChange}
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