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

// Services
import { 
  fetchRFPs, 
  createRFP, 
  updateRFPStatus, 
  updateRFPClient, 
  updateRFPMission, 
  updateRFPLocation, 
  updateRFPMaxRate, 
  updateRFPStartDate, 
  updateRFPCreatedAt, 
  updateRFPComments, 
  markRFPAsRead, 
  deleteRFP 
} from './services/rfp';

import { 
  fetchProspects, 
  createProspect, 
  updateProspectStatus, 
  updateProspectTargetAccount, 
  updateProspectAvailability, 
  updateProspectDailyRate, 
  updateProspectResidence, 
  updateProspectMobility, 
  updateProspectPhone, 
  updateProspectEmail, 
  updateProspectComments, 
  markProspectAsRead, 
  deleteProspect 
} from './services/prospects';

import { 
  fetchClientNeeds, 
  addClientNeed, 
  updateClientNeedStatus, 
  updateClientNeedSelectedNeed, 
  updateClientNeedAvailability, 
  updateClientNeedDailyRate, 
  updateClientNeedResidence, 
  updateClientNeedMobility, 
  updateClientNeedPhone, 
  updateClientNeedEmail, 
  updateClientNeedComments, 
  markClientNeedAsRead, 
  deleteClientNeed 
} from './services/clientNeeds';

import { analyzeRFP, analyzeProspect } from './services/openai';
import { extractFileContent, uploadFile } from './services/fileUpload';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Initialisation de l'authentification
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
        }
        
        if (mounted) {
          setSession(currentSession);
          console.log('Session set:', !!currentSession);
        }
        
        if (currentSession && mounted) {
          console.log('Loading initial data...');
          await loadInitialData();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('Loading state set to false');
        }
      }
    };

    initializeAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session);
      
      if (mounted) {
        setSession(session);
        
        if (event === 'SIGNED_IN' && session) {
          await loadInitialData();
        } else if (event === 'SIGNED_OUT') {
          setRfps([]);
          setProspects([]);
          setBoondmanagerProspects([]);
          setSalesReps([]);
        }
        
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('Loading initial data...');
      
      // Charger les commerciaux en premier
      await loadSalesReps();
      
      // Puis charger les autres données en parallèle
      await Promise.all([
        loadRFPs(),
        loadProspects(),
        loadClientNeeds()
      ]);
      
      console.log('Initial data loaded successfully');
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadSalesReps = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_reps')
        .select('*')
        .order('code');

      if (error) {
        console.error('Error loading sales reps:', error);
        return;
      }
      
      setSalesReps(data || []);
      console.log('Sales reps loaded:', data?.length);
    } catch (error) {
      console.error('Error in loadSalesReps:', error);
    }
  };

  const loadRFPs = async () => {
    try {
      const data = await fetchRFPs();
      setRfps(data);
      console.log('RFPs loaded:', data.length);
    } catch (error) {
      console.error('Error loading RFPs:', error);
    }
  };

  const loadProspects = async () => {
    try {
      const data = await fetchProspects();
      setProspects(data);
      console.log('Prospects loaded:', data.length);
    } catch (error) {
      console.error('Error loading prospects:', error);
    }
  };

  const loadClientNeeds = async () => {
    try {
      const data = await fetchClientNeeds();
      setBoondmanagerProspects(data);
      console.log('Client needs loaded:', data.length);
    } catch (error) {
      console.error('Error loading client needs:', error);
    }
  };

  // Handler pour analyser un RFP
  const handleAnalyzeRFP = async (content: string, assignedTo: string) => {
    try {
      setIsAnalyzing(true);
      
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
    } catch (error) {
      console.error('Error analyzing RFP:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler pour analyser un prospect
  const handleAnalyzeProspect = async (textContent: string, targetAccount: string, file: File | null, assignedTo: string) => {
    try {
      setIsAnalyzingProspect(true);
      
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
    } catch (error) {
      console.error('Error analyzing prospect:', error);
      throw error;
    } finally {
      setIsAnalyzingProspect(false);
    }
  };

  // Handler pour analyser un besoin client
  const handleAnalyzeBoondmanagerProspect = async (textContent: string, selectedNeedId: string, selectedNeedTitle: string, file: File | null, assignedTo: string) => {
    try {
      setIsAnalyzingBoondmanagerProspect(true);
      
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
    } catch (error) {
      console.error('Error analyzing client need:', error);
      throw error;
    } finally {
      setIsAnalyzingBoondmanagerProspect(false);
    }
  };

  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Chargement...</span>
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
                
                // Props pour l'extracteur AO
                rfps={rfps}
                salesReps={salesReps}
                onAnalyzeRFP={handleAnalyzeRFP}
                isAnalyzing={isAnalyzing}
                onStatusChange={async (id, status) => {
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
                  await updateRFPClient(id, client);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, client } : rfp
                  ));
                }}
                onMissionChange={async (id, mission) => {
                  await updateRFPMission(id, mission);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, mission } : rfp
                  ));
                }}
                onLocationChange={async (id, location) => {
                  await updateRFPLocation(id, location);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, location } : rfp
                  ));
                }}
                onMaxRateChange={async (id, maxRateStr) => {
                  const maxRate = maxRateStr ? parseFloat(maxRateStr) : null;
                  await updateRFPMaxRate(id, maxRate);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, maxRate } : rfp
                  ));
                }}
                onStartDateChange={async (id, startDate) => {
                  await updateRFPStartDate(id, startDate);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, startDate } : rfp
                  ));
                }}
                onCreatedAtChange={async (id, createdAt) => {
                  await updateRFPCreatedAt(id, createdAt);
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, createdAt } : rfp
                  ));
                }}
                onCommentsChange={async (id, comments) => {
                  setRfps(prev => prev.map(rfp => 
                    rfp.id === id ? { ...rfp, comments } : rfp
                  ));
                  await updateRFPComments(id, comments);
                }}
                onView={async (rfp) => {
                  await markRFPAsRead(rfp.id);
                  setRfps(prev => prev.map(r => 
                    r.id === rfp.id ? { ...r, isRead: true } : r
                  ));
                }}
                onDelete={async (id) => {
                  await deleteRFP(id);
                  setRfps(prev => prev.filter(rfp => rfp.id !== id));
                }}
                
                // Props pour les prospects
                prospects={prospects}
                onAnalyzeProspect={handleAnalyzeProspect}
                isAnalyzingProspect={isAnalyzingProspect}
                onProspectStatusChange={async (id, status) => {
                  await updateProspectStatus(id, status);
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, status } : prospect
                  ));
                }}
                onProspectAssigneeChange={async (id, assignedTo) => {
                  const { error } = await supabase
                    .from('prospects')
                    .update({ assigned_to: assignedTo })
                    .eq('id', id);
                  
                  if (error) throw error;
                  
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, assignedTo } : prospect
                  ));
                }}
                onProspectTargetAccountChange={async (id, targetAccount) => {
                  await updateProspectTargetAccount(id, targetAccount);
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, targetAccount } : prospect
                  ));
                }}
                onProspectAvailabilityChange={async (id, availability) => {
                  await updateProspectAvailability(id, availability);
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, availability } : prospect
                  ));
                }}
                onProspectDailyRateChange={async (id, dailyRateStr) => {
                  const dailyRate = dailyRateStr ? parseFloat(dailyRateStr) : null;
                  await updateProspectDailyRate(id, dailyRate);
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, dailyRate } : prospect
                  ));
                }}
                onProspectResidenceChange={async (id, residence) => {
                  await updateProspectResidence(id, residence);
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, residence } : prospect
                  ));
                }}
                onProspectMobilityChange={async (id, mobility) => {
                  await updateProspectMobility(id, mobility);
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, mobility } : prospect
                  ));
                }}
                onProspectPhoneChange={async (id, phone) => {
                  await updateProspectPhone(id, phone);
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, phone } : prospect
                  ));
                }}
                onProspectEmailChange={async (id, email) => {
                  await updateProspectEmail(id, email);
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, email } : prospect
                  ));
                }}
                onProspectView={async (prospect) => {
                  await markProspectAsRead(prospect.id);
                  setProspects(prev => prev.map(p => 
                    p.id === prospect.id ? { ...p, isRead: true } : p
                  ));
                }}
                onProspectDelete={async (id) => {
                  await deleteProspect(id);
                  setProspects(prev => prev.filter(prospect => prospect.id !== id));
                }}
                onProspectCommentsChange={async (id, comments) => {
                  setProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, comments } : prospect
                  ));
                  await updateProspectComments(id, comments);
                }}
                
                // Props pour les besoins clients
                boondmanagerProspects={boondmanagerProspects}
                onAnalyzeBoondmanagerProspect={handleAnalyzeBoondmanagerProspect}
                isAnalyzingBoondmanagerProspect={isAnalyzingBoondmanagerProspect}
                onBoondmanagerProspectStatusChange={async (id, status) => {
                  await updateClientNeedStatus(id, status);
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, status } : prospect
                  ));
                }}
                onBoondmanagerProspectAssigneeChange={async (id, assignedTo) => {
                  const { error } = await supabase
                    .from('client_needs')
                    .update({ assigned_to: assignedTo })
                    .eq('id', id);
                  
                  if (error) throw error;
                  
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, assignedTo } : prospect
                  ));
                }}
                onBoondmanagerProspectSelectedNeedChange={async (id, selectedNeedTitle) => {
                  await updateClientNeedSelectedNeed(id, selectedNeedTitle);
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, selectedNeedTitle } : prospect
                  ));
                }}
                onBoondmanagerProspectAvailabilityChange={async (id, availability) => {
                  await updateClientNeedAvailability(id, availability);
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, availability } : prospect
                  ));
                }}
                onBoondmanagerProspectDailyRateChange={async (id, dailyRateStr) => {
                  const dailyRate = dailyRateStr ? parseFloat(dailyRateStr) : null;
                  await updateClientNeedDailyRate(id, dailyRate);
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, dailyRate } : prospect
                  ));
                }}
                onBoondmanagerProspectResidenceChange={async (id, residence) => {
                  await updateClientNeedResidence(id, residence);
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, residence } : prospect
                  ));
                }}
                onBoondmanagerProspectMobilityChange={async (id, mobility) => {
                  await updateClientNeedMobility(id, mobility);
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, mobility } : prospect
                  ));
                }}
                onBoondmanagerProspectPhoneChange={async (id, phone) => {
                  await updateClientNeedPhone(id, phone);
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, phone } : prospect
                  ));
                }}
                onBoondmanagerProspectEmailChange={async (id, email) => {
                  await updateClientNeedEmail(id, email);
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, email } : prospect
                  ));
                }}
                onBoondmanagerProspectView={async (prospect) => {
                  await markClientNeedAsRead(prospect.id);
                  setBoondmanagerProspects(prev => prev.map(p => 
                    p.id === prospect.id ? { ...p, isRead: true } : p
                  ));
                }}
                onBoondmanagerProspectDelete={async (id) => {
                  await deleteClientNeed(id);
                  setBoondmanagerProspects(prev => prev.filter(prospect => prospect.id !== id));
                }}
                onBoondmanagerProspectCommentsChange={async (id, comments) => {
                  setBoondmanagerProspects(prev => prev.map(prospect => 
                    prospect.id === id ? { ...prospect, comments } : prospect
                  ));
                  await updateClientNeedComments(id, comments);
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