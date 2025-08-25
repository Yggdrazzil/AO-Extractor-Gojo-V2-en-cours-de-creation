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
import { analyzeRFP } from './services/openai';
import { analyzeProspect } from './services/openai';
import { 
  createRFP, 
  updateRFPStatus, 
  updateRFPComments,
  markRFPAsRead,
  deleteRFP 
} from './services/rfp';
import { 
  createProspect,
  updateProspectStatus,
  updateProspectComments,
  markProspectAsRead,
  deleteProspect
} from './services/prospects';
import { 
  addClientNeed,
  updateClientNeedStatus,
  updateClientNeedComments,
  markClientNeedAsRead,
  deleteClientNeed
} from './services/clientNeeds';
import { uploadFile } from './services/fileUpload';
import { extractFileContent } from './services/fileUpload';

// Fonction utilitaire pour ajouter un timeout aux promesses
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initialisation...');
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

  // Chargement des commerciaux avec timeout
  const loadSalesReps = async () => {
    try {
      console.log('👥 Loading sales reps...');
      setLoadingMessage('Chargement des commerciaux...');
      
      const { data, error } = await withTimeout(
        supabase
          .from('sales_reps')
          .select('*')
          .order('code'),
        5000
      );

      if (error) {
        console.warn('⚠️ Sales reps error (non-blocking):', error);
        setSalesReps([]);
        return;
      }
      
      setSalesReps(data || []);
      console.log('✅ Sales reps loaded:', data?.length || 0);
    } catch (error) {
      console.warn('⚠️ Sales reps timeout/error (non-blocking):', error);
      setSalesReps([]);
    }
  };

  // Chargement des RFPs avec timeout
  const loadRFPs = async () => {
    try {
      console.log('📋 Loading RFPs...');
      setLoadingMessage('Chargement des AOs...');
      
      const { data, error } = await withTimeout(
        supabase
          .from('rfps')
          .select('id, client, mission, location, max_rate, created_at, start_date, status, assigned_to, raw_content, is_read, comments')
          .order('created_at', { ascending: false }),
        5000
      );

      if (error) {
        console.warn('⚠️ RFPs error (non-blocking):', error);
        setRfps([]);
        return;
      }
      
      const mappedRfps = (data || []).map(rfp => ({
        id: rfp.id,
        client: rfp.client || '',
        mission: rfp.mission || '',
        location: rfp.location || '',
        maxRate: rfp.max_rate,
        createdAt: rfp.created_at,
        startDate: rfp.start_date,
        status: rfp.status,
        assignedTo: rfp.assigned_to,
        content: rfp.raw_content || '',
        isRead: rfp.is_read || false,
        comments: rfp.comments || ''
      }));
      
      setRfps(mappedRfps);
      console.log('✅ RFPs loaded:', mappedRfps.length);
    } catch (error) {
      console.warn('⚠️ RFPs timeout/error (non-blocking):', error);
      setRfps([]);
    }
  };

  // Chargement des prospects avec timeout
  const loadProspects = async () => {
    try {
      console.log('👤 Loading prospects...');
      setLoadingMessage('Chargement des prospects...');
      
      const { data, error } = await withTimeout(
        supabase
          .from('prospects')
          .select('*')
          .order('created_at', { ascending: false }),
        5000
      );

      if (error) {
        console.warn('⚠️ Prospects error (non-blocking):', error);
        setProspects([]);
        return;
      }
      
      const mappedProspects = (data || []).map(prospect => ({
        id: prospect.id,
        textContent: prospect.text_content || '',
        fileName: prospect.file_name,
        fileUrl: prospect.file_url,
        fileContent: prospect.file_content,
        targetAccount: prospect.target_account || '',
        availability: prospect.availability || '-',
        dailyRate: prospect.daily_rate,
        salaryExpectations: prospect.salary_expectations,
        residence: prospect.residence || '-',
        mobility: prospect.mobility || '-',
        phone: prospect.phone || '-',
        email: prospect.email || '-',
        status: prospect.status,
        assignedTo: prospect.assigned_to,
        isRead: prospect.is_read || false,
        comments: prospect.comments || ''
      }));
      
      setProspects(mappedProspects);
      console.log('✅ Prospects loaded:', mappedProspects.length);
    } catch (error) {
      console.warn('⚠️ Prospects timeout/error (non-blocking):', error);
      setProspects([]);
    }
  };

  // Chargement des besoins clients avec timeout
  const loadClientNeeds = async () => {
    try {
      console.log('🎯 Loading client needs...');
      setLoadingMessage('Chargement des besoins clients...');
      
      const { data, error } = await withTimeout(
        supabase
          .from('client_needs')
          .select('*')
          .order('created_at', { ascending: false }),
        5000
      );

      if (error) {
        console.warn('⚠️ Client needs error (non-blocking):', error);
        setBoondmanagerProspects([]);
        return;
      }
      
      const mappedClientNeeds = (data || []).map(need => ({
        id: need.id,
        textContent: need.text_content || '',
        fileName: need.file_name,
        fileUrl: need.file_url,
        fileContent: need.file_content,
        selectedNeedId: need.selected_need_id,
        selectedNeedTitle: need.selected_need_title,
        availability: need.availability || '-',
        dailyRate: need.daily_rate,
        salaryExpectations: need.salary_expectations,
        residence: need.residence || '-',
        mobility: need.mobility || '-',
        phone: need.phone || '-',
        email: need.email || '-',
        status: need.status,
        assignedTo: need.assigned_to,
        isRead: need.is_read || false,
        comments: need.comments || ''
      }));
      
      setBoondmanagerProspects(mappedClientNeeds);
      console.log('✅ Client needs loaded:', mappedClientNeeds.length);
    } catch (error) {
      console.warn('⚠️ Client needs timeout/error (non-blocking):', error);
      setBoondmanagerProspects([]);
    }
  };

  // Initialisation avec timeout global
  useEffect(() => {
    let mounted = true;
    
    const initializeApp = async () => {
      try {
        console.log('🚀 App initialization started...');
        setLoadingMessage('Vérification de l\'authentification...');
        
        // Étape 1: Vérifier la session avec timeout
        const { data: { session: currentSession }, error } = await withTimeout(
          supabase.auth.getSession(),
          3000
        );
        
        if (error) {
          console.error('❌ Session error:', error);
          throw new Error(`Erreur de session: ${error.message}`);
        }
        
        console.log('✅ Session check completed:', !!currentSession);
        
        if (!mounted) return;
        
        setSession(currentSession);
        
        if (currentSession) {
          console.log('📊 Loading application data...');
          setLoadingMessage('Chargement des données...');
          
          // Charger les données avec timeout global de 15 secondes
          const loadDataWithTimeout = async () => {
            return withTimeout(
              Promise.allSettled([
                loadSalesReps(),
                loadRFPs(),
                loadProspects(),
                loadClientNeeds()
              ]),
              15000 // 15 secondes maximum pour tout charger
            );
          };
          
          try {
            await loadDataWithTimeout();
            console.log('✅ All data loading completed');
          } catch (loadError) {
            console.warn('⚠️ Data loading timeout - continuing with partial data:', loadError);
            // Continuer même si le chargement des données échoue
          }
        }
        
        // TOUJOURS débloquer l'interface après maximum 20 secondes
        if (mounted) {
          console.log('🎉 App initialization completed');
          setLoading(false);
          setLoadingMessage('');
        }
      } catch (error) {
        console.error('💥 App initialization error:', error);
        if (mounted) {
          setError(`Erreur d'initialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          setLoading(false);
        }
      }
    };

    // Déblocage automatique après 20 secondes maximum
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⏰ Force unlock after 20 seconds timeout');
        setLoading(false);
        setLoadingMessage('');
      }
    }, 20000);

    initializeApp();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, !!session);
      
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Handler pour analyser un RFP avec mise à jour optimiste
  const handleAnalyzeRFP = async (content: string, assignedTo: string) => {
    try {
      setIsAnalyzing(true);
      console.log('🔍 Analyzing RFP...');
      
      const analysisResult = await analyzeRFP(content);
      console.log('📊 Analysis result:', analysisResult);
      
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
        isRead: false,
        comments: ''
      });
      
      // Mise à jour optimiste
      setRfps(prev => [newRFP, ...prev]);
      console.log('✅ RFP created and added to list');
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
      
      // Gestion du fichier
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileContent: string | undefined;
      
      if (file) {
        try {
          const uploadResult = await uploadFile(file, 'cvs');
          fileUrl = uploadResult.url;
          fileName = file.name;
          fileContent = uploadResult.content;
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
        }
      }
      
      // Analyser le contenu
      let analysisResult;
      try {
        analysisResult = await analyzeProspect(textContent, fileContent);
      } catch (analysisError) {
        console.warn('Analysis failed, using default values:', analysisError);
        analysisResult = {
          availability: '-',
          dailyRate: null,
          salaryExpectations: null,
          residence: '-',
          mobility: '-',
          phone: '-',
          email: '-'
        };
      }
      
      const newProspect = await createProspect({
        textContent,
        targetAccount,
        fileName,
        fileUrl,
        fileContent,
        availability: analysisResult.availability || '-',
        dailyRate: analysisResult.dailyRate,
        salaryExpectations: analysisResult.salaryExpectations,
        residence: analysisResult.residence || '-',
        mobility: analysisResult.mobility || '-',
        phone: analysisResult.phone || '-',
        email: analysisResult.email || '-',
        status: 'À traiter',
        assignedTo,
        isRead: false,
        comments: ''
      }, file);
      
      // Mise à jour optimiste
      setProspects(prev => [newProspect, ...prev]);
      console.log('✅ Prospect created and added to list');
    } catch (error) {
      console.error('❌ Error analyzing prospect:', error);
      throw error;
    } finally {
      setIsAnalyzingProspect(false);
    }
  };

  // Handler pour analyser un besoin client
  const handleAnalyzeBoondmanagerProspect = async (
    textContent: string, 
    selectedNeedId: string, 
    selectedNeedTitle: string, 
    file: File | null, 
    assignedTo: string
  ) => {
    try {
      setIsAnalyzingBoondmanagerProspect(true);
      console.log('🔍 Analyzing client need...');
      
      // Gestion du fichier
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileContent: string | undefined;
      
      if (file) {
        try {
          const uploadResult = await uploadFile(file, 'cvs');
          fileUrl = uploadResult.url;
          fileName = file.name;
          fileContent = uploadResult.content;
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
        }
      }
      
      // Analyser le contenu
      let analysisResult;
      try {
        analysisResult = await analyzeProspect(textContent, fileContent);
      } catch (analysisError) {
        console.warn('Analysis failed, using default values:', analysisError);
        analysisResult = {
          availability: '-',
          dailyRate: null,
          salaryExpectations: null,
          residence: '-',
          mobility: '-',
          phone: '-',
          email: '-'
        };
      }
      
      const newClientNeed = await addClientNeed({
        id: '', // Sera généré
        textContent,
        selectedNeedId,
        selectedNeedTitle,
        fileName,
        fileUrl,
        fileContent,
        availability: analysisResult.availability || '-',
        dailyRate: analysisResult.dailyRate,
        salaryExpectations: analysisResult.salaryExpectations,
        residence: analysisResult.residence || '-',
        mobility: analysisResult.mobility || '-',
        phone: analysisResult.phone || '-',
        email: analysisResult.email || '-',
        status: 'À traiter',
        assignedTo,
        isRead: false,
        comments: ''
      });
      
      // Mise à jour optimiste
      setBoondmanagerProspects(prev => [newClientNeed, ...prev]);
      console.log('✅ Client need created and added to list');
    } catch (error) {
      console.error('❌ Error analyzing client need:', error);
      throw error;
    } finally {
      setIsAnalyzingBoondmanagerProspect(false);
    }
  };

  // Initialisation de l'application
  useEffect(() => {
    let mounted = true;
    
    const initializeApp = async () => {
      try {
        console.log('🚀 App initialization started...');
        
        // Étape 1: Session
        setLoadingMessage('Vérification de la connexion...');
        const { data: { session: currentSession }, error } = await withTimeout(
          supabase.auth.getSession(),
          5000
        );
        
        if (error) {
          throw new Error(`Erreur de session: ${error.message}`);
        }
        
        console.log('✅ Session verified:', !!currentSession);
        
        if (!mounted) return;
        setSession(currentSession);
        
        if (currentSession) {
          // Étape 2: Charger les données de base en parallèle avec timeouts individuels
          console.log('📊 Starting data loading...');
          
          try {
            await Promise.allSettled([
              loadSalesReps(),
              loadRFPs(),
              loadProspects(),
              loadClientNeeds()
            ]);
          } catch (dataError) {
            console.warn('⚠️ Some data failed to load, continuing anyway:', dataError);
          }
        }
        
      } catch (error) {
        console.error('💥 Initialization error:', error);
        if (mounted) {
          setError(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      } finally {
        if (mounted) {
          console.log('🎉 App ready!');
          setLoading(false);
          setLoadingMessage('');
        }
      }
    };

    // Timeout de sécurité - débloquer l'interface après 15 secondes maximum
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⏰ Safety timeout triggered - forcing app to load');
        setLoading(false);
        setLoadingMessage('');
      }
    }, 15000);

    initializeApp();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth changed:', event);
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Affichage des erreurs
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
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  // Écran de chargement avec message dynamique
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">
            {loadingMessage || 'Chargement...'}
          </span>
          <div className="text-xs text-gray-400">
            L'application se débloquera automatiquement dans quelques secondes
          </div>
        </div>
      </div>
    );
  }

  // Écran de connexion
  if (!session) {
    return <LoginForm onLoginSuccess={setSession} />;
  }

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
                rfps={rfps}
                prospects={prospects}
                boondmanagerProspects={boondmanagerProspects}
                salesReps={salesReps}
                onAnalyzeRFP={handleAnalyzeRFP}
                onAnalyzeProspect={handleAnalyzeProspect}
                onAnalyzeBoondmanagerProspect={handleAnalyzeBoondmanagerProspect}
                isAnalyzing={isAnalyzing}
                isAnalyzingProspect={isAnalyzingProspect}
                isAnalyzingBoondmanagerProspect={isAnalyzingBoondmanagerProspect}
                
                // Handlers RFP avec mise à jour optimiste
                onStatusChange={async (id, status) => {
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, status } : rfp
                  ));
                  try {
                    await updateRFPStatus(id, status);
                  } catch (error) {
                    console.error('Error updating RFP status:', error);
                    // Recharger les données en cas d'erreur
                    loadRFPs();
                  }
                }}
                
                onCommentsChange={async (id, comments) => {
                  console.log('💬 Updating RFP comments optimistically');
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, comments } : rfp
                  ));
                  try {
                    await updateRFPComments(id, comments);
                    console.log('✅ RFP comments saved to database');
                  } catch (error) {
                    console.error('❌ Error saving RFP comments:', error);
                  }
                }}
                
                onView={async (rfp) => {
                  setRfps(prev => prev.map(r => 
                    r.id === rfp.id ? { ...r, isRead: true } : r
                  ));
                  try {
                    await markRFPAsRead(rfp.id);
                  } catch (error) {
                    console.error('Error marking RFP as read:', error);
                  }
                }}
                
                onDelete={async (id) => {
                  setRfps(prev => prev.filter(rfp => rfp.id !== id));
                  try {
                    await deleteRFP(id);
                  } catch (error) {
                    console.error('Error deleting RFP:', error);
                    // Recharger en cas d'erreur
                    loadRFPs();
                  }
                }}
                
                // Handlers Prospects avec mise à jour optimiste
                onProspectStatusChange={async (id, status) => {
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, status } : prospect
                  ));
                  try {
                    await updateProspectStatus(id, status);
                  } catch (error) {
                    console.error('Error updating prospect status:', error);
                    loadProspects();
                  }
                }}
                
                onProspectCommentsChange={async (id, comments) => {
                  console.log('💬 Updating prospect comments optimistically');
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, comments } : prospect
                  ));
                  try {
                    await updateProspectComments(id, comments);
                    console.log('✅ Prospect comments saved to database');
                  } catch (error) {
                    console.error('❌ Error saving prospect comments:', error);
                  }
                }}
                
                onProspectView={async (prospect) => {
                  setProspects(prev => prev.map(p => 
                    p.id === prospect.id ? { ...p, isRead: true } : p
                  ));
                  try {
                    await markProspectAsRead(prospect.id);
                  } catch (error) {
                    console.error('Error marking prospect as read:', error);
                  }
                }}
                
                onProspectDelete={async (id) => {
                  setProspects(prev => prev.filter(prospect => prospect.id !== id));
                  try {
                    await deleteProspect(id);
                  } catch (error) {
                    console.error('Error deleting prospect:', error);
                    loadProspects();
                  }
                }}
                
                // Handlers Client Needs avec mise à jour optimiste
                onBoondmanagerProspectStatusChange={async (id, status) => {
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, status } : prospect
                  ));
                  try {
                    await updateClientNeedStatus(id, status);
                  } catch (error) {
                    console.error('Error updating client need status:', error);
                    loadClientNeeds();
                  }
                }}
                
                onBoondmanagerProspectCommentsChange={async (id, comments) => {
                  console.log('💬 Updating client need comments optimistically');
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, comments } : prospect
                  ));
                  try {
                    await updateClientNeedComments(id, comments);
                    console.log('✅ Client need comments saved to database');
                  } catch (error) {
                    console.error('❌ Error saving client need comments:', error);
                  }
                }}
                
                onBoondmanagerProspectView={async (prospect) => {
                  setBoondmanagerProspects(prev => prev.map(p => 
                    p.id === prospect.id ? { ...p, isRead: true } : p
                  ));
                  try {
                    await markClientNeedAsRead(prospect.id);
                  } catch (error) {
                    console.error('Error marking client need as read:', error);
                  }
                }}
                
                onBoondmanagerProspectDelete={async (id) => {
                  setBoondmanagerProspects(prev => prev.filter(prospect => prospect.id !== id));
                  try {
                    await deleteClientNeed(id);
                  } catch (error) {
                    console.error('Error deleting client need:', error);
                    loadClientNeeds();
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