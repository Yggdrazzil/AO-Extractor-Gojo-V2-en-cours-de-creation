import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TabContent } from './components/TabContent';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import type { Session } from '@supabase/supabase-js';
import type { RFP, SalesRep, Prospect, BoondmanagerProspect } from './types';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('rfp-extractor');
  
  // États pour les données
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [boondmanagerProspects, setBoondmanagerProspects] = useState<BoondmanagerProspect[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  
  // États de chargement
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingProspect, setIsAnalyzingProspect] = useState(false);
  const [isAnalyzingBoondmanagerProspect, setIsAnalyzingBoondmanagerProspect] = useState(false);

  // Debug: Log le début du montage du composant
  useEffect(() => {
    console.log('🚀 App component mounted');
    return () => console.log('💀 App component unmounted');
  }, []);

  // Initialisation de l'authentification
  useEffect(() => {
    let mounted = true;
    console.log('🔐 Initializing authentication...');

    const initializeAuth = async () => {
      try {
        console.log('📡 Getting current session...');
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          setError(`Erreur de session: ${error.message}`);
        } else {
          console.log('✅ Session retrieved:', !!currentSession);
        }
        
        if (mounted) {
          setSession(currentSession);
          console.log('📝 Session state updated');
        }
        
        if (currentSession && mounted) {
          console.log('📊 Loading initial data for authenticated user...');
          await loadInitialData();
        }
      } catch (error) {
        console.error('💥 Auth initialization error:', error);
        if (mounted) {
          setError(`Erreur d'initialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      } finally {
        if (mounted) {
          console.log('✅ Setting loading to false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Écouter les changements d'authentification
    console.log('👂 Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, !!session);
      
      if (mounted) {
        setSession(session);
        setError(null);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('🔑 User signed in, loading data...');
          await loadInitialData();
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out, clearing data...');
          setRfps([]);
          setProspects([]);
          setBoondmanagerProspects([]);
          setSalesReps([]);
        }
        
        setLoading(false);
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth effects...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('📈 Starting to load initial data...');
      
      // Charger les commerciaux en premier
      console.log('👥 Loading sales reps...');
      await loadSalesReps();
      
      // Puis charger les autres données
      console.log('📋 Loading RFPs, prospects, and client needs...');
      await Promise.all([
        loadRFPs(),
        loadProspects(),
        loadClientNeeds()
      ]);
      
      console.log('✅ Initial data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      setError(`Erreur de chargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const loadSalesReps = async () => {
    try {
      console.log('🔍 Fetching sales reps from database...');
      const { data, error } = await supabase
        .from('sales_reps')
        .select('*')
        .order('code');

      if (error) {
        console.error('❌ Error loading sales reps:', error);
        throw error;
      }
      
      setSalesReps(data || []);
      console.log('✅ Sales reps loaded:', data?.length);
    } catch (error) {
      console.error('💥 Error in loadSalesReps:', error);
      throw error;
    }
  };

  const loadRFPs = async () => {
    try {
      console.log('📋 Loading RFPs...');
      const { fetchRFPs } = await import('./services/rfp');
      const data = await fetchRFPs();
      setRfps(data);
      console.log('✅ RFPs loaded:', data.length);
    } catch (error) {
      console.error('❌ Error loading RFPs:', error);
      // Ne pas bloquer l'app pour une erreur de chargement des RFPs
    }
  };

  const loadProspects = async () => {
    try {
      console.log('👤 Loading prospects...');
      const { fetchProspects } = await import('./services/prospects');
      const data = await fetchProspects();
      setProspects(data);
      console.log('✅ Prospects loaded:', data.length);
    } catch (error) {
      console.error('❌ Error loading prospects:', error);
      // Ne pas bloquer l'app pour une erreur de chargement des prospects
    }
  };

  const loadClientNeeds = async () => {
    try {
      console.log('🎯 Loading client needs...');
      const { fetchClientNeeds } = await import('./services/clientNeeds');
      const data = await fetchClientNeeds();
      setBoondmanagerProspects(data);
      console.log('✅ Client needs loaded:', data.length);
    } catch (error) {
      console.error('❌ Error loading client needs:', error);
      // Ne pas bloquer l'app pour une erreur de chargement des besoins clients
    }
  };

  // Handler pour analyser un RFP
  const handleAnalyzeRFP = async (content: string, assignedTo: string) => {
    try {
      setIsAnalyzing(true);
      console.log('🔍 Analyzing RFP...');
      
      const { analyzeRFP } = await import('./services/openai');
      const { createRFP } = await import('./services/rfp');
      
      const analysisResult = await analyzeRFP(content);
      
      const newRFP = await createRFP({
        client: analysisResult.client || 'Non spécifié',
        mission: analysisResult.mission || 'Non spécifié',
        location: analysisResult.location || 'Non spécifié',
        maxRate: analysisResult.maxRate,
        createdAt: analysisResult.createdAt || new Date().toISOString(),
        startDate: analysisResult.startDate,
        status: 'À traiter',
        assignedTo,
        content,
        isRead: false
      });

      setRfps(prev => [newRFP, ...prev]);
      console.log('✅ RFP analyzed and created');
    } catch (error) {
      console.error('❌ Error analyzing RFP:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler pour analyser un prospect
  const handleAnalyzeProspect = async (textContent: string, targetAccount: string, file: File | null, assignedTo: string) => {
    try {
      setIsAnalyzingProspect(true);
      console.log('🔍 Analyzing prospect...');
      
      const { analyzeProspect } = await import('./services/openai');
      const { extractFileContent } = await import('./services/fileUpload');
      const { createProspect } = await import('./services/prospects');
      
      let cvContent = undefined;
      if (file) {
        try {
          cvContent = await extractFileContent(file);
        } catch (fileError) {
          console.error('Error extracting file content:', fileError);
        }
      }

      let analysisResult;
      if (textContent.trim() || cvContent) {
        try {
          analysisResult = await analyzeProspect(textContent.trim(), cvContent);
        } catch (analysisError) {
          console.error('Error analyzing prospect:', analysisError);
          analysisResult = {};
        }
      }

      const newProspect = await createProspect({
        textContent,
        targetAccount,
        fileName: file?.name,
        fileUrl: null,
        fileContent: cvContent,
        availability: analysisResult?.availability || '-',
        dailyRate: analysisResult?.dailyRate || null,
        salaryExpectations: analysisResult?.salaryExpectations || null,
        residence: analysisResult?.residence || '-',
        mobility: analysisResult?.mobility || '-',
        phone: analysisResult?.phone || '-',
        email: analysisResult?.email || '-',
        status: 'À traiter',
        assignedTo,
        isRead: false
      }, file);

      setProspects(prev => [newProspect, ...prev]);
      console.log('✅ Prospect analyzed and created');
    } catch (error) {
      console.error('❌ Error analyzing prospect:', error);
      throw error;
    } finally {
      setIsAnalyzingProspect(false);
    }
  };

  // Handler pour analyser un besoin client
  const handleAnalyzeBoondmanagerProspect = async (textContent: string, selectedNeedId: string, selectedNeedTitle: string, file: File | null, assignedTo: string) => {
    try {
      setIsAnalyzingBoondmanagerProspect(true);
      console.log('🔍 Analyzing client need...');
      
      const { analyzeProspect } = await import('./services/openai');
      const { uploadFile } = await import('./services/fileUpload');
      const { addClientNeed } = await import('./services/clientNeeds');
      
      let cvContent = undefined;
      let fileUrl = null;
      let fileName = null;
      
      if (file) {
        try {
          const uploadResult = await uploadFile(file, 'cvs');
          fileUrl = uploadResult.url;
          fileName = file.name;
          cvContent = uploadResult.content;
        } catch (fileError) {
          console.error('Error uploading file:', fileError);
        }
      }

      let analysisResult;
      if (textContent.trim() || cvContent) {
        try {
          analysisResult = await analyzeProspect(textContent.trim(), cvContent);
        } catch (analysisError) {
          console.error('Error analyzing client need:', analysisError);
          analysisResult = {};
        }
      }

      const newClientNeed = await addClientNeed({
        id: '',
        textContent,
        fileName,
        fileUrl,
        fileContent: cvContent,
        selectedNeedId,
        selectedNeedTitle,
        availability: analysisResult?.availability || '-',
        dailyRate: analysisResult?.dailyRate || null,
        salaryExpectations: analysisResult?.salaryExpectations || null,
        residence: analysisResult?.residence || '-',
        mobility: analysisResult?.mobility || '-',
        phone: analysisResult?.phone || '-',
        email: analysisResult?.email || '-',
        status: 'À traiter',
        assignedTo,
        isRead: false
      });

      setBoondmanagerProspects(prev => [newClientNeed, ...prev]);
      console.log('✅ Client need analyzed and created');
    } catch (error) {
      console.error('❌ Error analyzing client need:', error);
      throw error;
    } finally {
      setIsAnalyzingBoondmanagerProspect(false);
    }
  };

  // Affichage des erreurs de debug si présentes
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg">
          <h2 className="text-red-800 font-semibold mb-2">Erreur de chargement</h2>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  // Écran de chargement avec plus d'infos
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Chargement de l'application...</span>
          <div className="text-xs text-gray-500">Vérification de la session et chargement des données</div>
        </div>
      </div>
    );
  }

  // Écran de connexion
  if (!session) {
    console.log('🔐 No session, showing login form');
    return <LoginForm onLoginSuccess={setSession} />;
  }

  console.log('🎨 Rendering main application interface');

  // Application principale
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            rfps={rfps}
            prospects={prospects}
            boondmanagerProspects={boondmanagerProspects}
          />
          <div className="flex-1 flex flex-col">
            <Header />
            
            <div className="flex-1 overflow-hidden">
              <TabContent
                activeTab={activeTab}
                
                // Props pour l'extracteur AO
                rfps={rfps}
                salesReps={salesReps}
                onAnalyzeRFP={handleAnalyzeRFP}
                isAnalyzing={isAnalyzing}
                onStatusChange={async (id, status) => {
                  const { updateRFPStatus } = await import('./services/rfp');
                  await updateRFPStatus(id, status);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, status } : rfp
                  ));
                }}
                onAssigneeChange={async (id, assignedTo) => {
                  const { error } = await supabase
                    .from('rfps')
                    .update({ assigned_to: assignedTo })
                    .eq('id', id);
                  
                  if (error) throw error;
                  
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, assignedTo } : rfp
                  ));
                }}
                onClientChange={async (id, client) => {
                  const { updateRFPClient } = await import('./services/rfp');
                  await updateRFPClient(id, client);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, client } : rfp
                  ));
                }}
                onMissionChange={async (id, mission) => {
                  const { updateRFPMission } = await import('./services/rfp');
                  await updateRFPMission(id, mission);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, mission } : rfp
                  ));
                }}
                onLocationChange={async (id, location) => {
                  const { updateRFPLocation } = await import('./services/rfp');
                  await updateRFPLocation(id, location);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, location } : rfp
                  ));
                }}
                onMaxRateChange={async (id, maxRateStr) => {
                  const { updateRFPMaxRate } = await import('./services/rfp');
                  const maxRate = maxRateStr ? parseFloat(maxRateStr) : null;
                  await updateRFPMaxRate(id, maxRate);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, maxRate } : rfp
                  ));
                }}
                onStartDateChange={async (id, startDate) => {
                  const { updateRFPStartDate } = await import('./services/rfp');
                  await updateRFPStartDate(id, startDate);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, startDate } : rfp
                  ));
                }}
                onCreatedAtChange={async (id, createdAt) => {
                  const { updateRFPCreatedAt } = await import('./services/rfp');
                  await updateRFPCreatedAt(id, createdAt);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, createdAt } : rfp
                  ));
                }}
                onCommentsChange={async (id, comments) => {
                  console.log('💬 Updating RFP comments:', id, comments.length);
                  // Mise à jour optimiste de l'état local AVANT la sauvegarde
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, comments } : rfp
                  ));
                  // Sauvegarde en base de données
                  try {
                    const { updateRFPComments } = await import('./services/rfp');
                    await updateRFPComments(id, comments);
                    console.log('✅ RFP comments saved successfully');
                  } catch (error) {
                    console.error('❌ Error saving RFP comments:', error);
                    // Revenir à l'ancien état en cas d'erreur
                    setRfps(prev => prev.map(rfp => 
                      rfp.id === id ? { ...rfp, comments: rfp.comments || '' } : rfp
                    ));
                  }
                }}
                onView={async (rfp) => {
                  const { markRFPAsRead } = await import('./services/rfp');
                  await markRFPAsRead(rfp.id);
                  setRfps(prev => prev.map(r => 
                    r.id === rfp.id ? { ...r, isRead: true } : r
                  ));
                }}
                onDelete={async (id) => {
                  const { deleteRFP } = await import('./services/rfp');
                  await deleteRFP(id);
                  setRfps(prev => prev.filter(rfp => rfp.id !== id));
                }}
                
                // Props pour les prospects (simplifiés pour éviter les erreurs)
                prospects={prospects}
                onAnalyzeProspect={handleAnalyzeProspect}
                isAnalyzingProspect={isAnalyzingProspect}
                onProspectStatusChange={async (id, status) => {
                  const { updateProspectStatus } = await import('./services/prospects');
                  await updateProspectStatus(id, status);
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, status } : prospect
                  ));
                }}
                onProspectView={async (prospect) => {
                  const { markProspectAsRead } = await import('./services/prospects');
                  await markProspectAsRead(prospect.id);
                  setProspects(prev => prev.map(p => 
                    p.id === prospect.id ? { ...p, isRead: true } : p
                  ));
                }}
                onProspectCommentsChange={async (id, comments) => {
                  console.log('💬 Updating prospect comments:', id, comments.length);
                  // Mise à jour optimiste
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, comments } : prospect
                  ));
                  try {
                    const { updateProspectComments } = await import('./services/prospects');
                    await updateProspectComments(id, comments);
                    console.log('✅ Prospect comments saved successfully');
                  } catch (error) {
                    console.error('❌ Error saving prospect comments:', error);
                  }
                }}
                
                // Props pour les besoins clients (simplifiés)
                boondmanagerProspects={boondmanagerProspects}
                onAnalyzeBoondmanagerProspect={handleAnalyzeBoondmanagerProspect}
                isAnalyzingBoondmanagerProspect={isAnalyzingBoondmanagerProspect}
                onBoondmanagerProspectStatusChange={async (id, status) => {
                  const { updateClientNeedStatus } = await import('./services/clientNeeds');
                  await updateClientNeedStatus(id, status);
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, status } : prospect
                  ));
                }}
                onBoondmanagerProspectView={async (prospect) => {
                  const { markClientNeedAsRead } = await import('./services/clientNeeds');
                  await markClientNeedAsRead(prospect.id);
                  setBoondmanagerProspects(prev => prev.map(p => 
                    p.id === prospect.id ? { ...p, isRead: true } : p
                  ));
                }}
                onBoondmanagerProspectCommentsChange={async (id, comments) => {
                  console.log('💬 Updating client need comments:', id, comments.length);
                  // Mise à jour optimiste
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, comments } : prospect
                  ));
                  try {
                    const { updateClientNeedComments } = await import('./services/clientNeeds');
                    await updateClientNeedComments(id, comments);
                    console.log('✅ Client need comments saved successfully');
                  } catch (error) {
                    console.error('❌ Error saving client need comments:', error);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;