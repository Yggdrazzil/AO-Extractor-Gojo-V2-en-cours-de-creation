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

  // Chargement des commerciaux avec gestion d'erreur robuste
  const loadSalesReps = async () => {
    try {
      console.log('👥 Loading sales reps...');
      const { data, error } = await supabase
        .from('sales_reps')
        .select('*')
        .order('code');

      if (error) {
        console.error('❌ Error loading sales reps:', error);
        // Ne pas bloquer l'app, utiliser des données par défaut
        setSalesReps([]);
        return;
      }
      
      setSalesReps(data || []);
      console.log('✅ Sales reps loaded:', data?.length || 0);
    } catch (error) {
      console.error('💥 Error in loadSalesReps:', error);
      setSalesReps([]); // Données par défaut
    }
  };

  // Chargement des RFPs avec gestion d'erreur
  const loadRFPs = async () => {
    try {
      console.log('📋 Loading RFPs...');
      const { data, error } = await supabase
        .from('rfps')
        .select('id, client, mission, location, max_rate, created_at, start_date, status, assigned_to, raw_content, is_read, comments')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading RFPs:', error);
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
      console.error('💥 Error in loadRFPs:', error);
      setRfps([]);
    }
  };

  // Chargement des prospects avec gestion d'erreur
  const loadProspects = async () => {
    try {
      console.log('👤 Loading prospects...');
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading prospects:', error);
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
      console.error('💥 Error in loadProspects:', error);
      setProspects([]);
    }
  };

  // Chargement des besoins clients avec gestion d'erreur
  const loadClientNeeds = async () => {
    try {
      console.log('🎯 Loading client needs...');
      const { data, error } = await supabase
        .from('client_needs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading client needs:', error);
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
      console.error('💥 Error in loadClientNeeds:', error);
      setBoondmanagerProspects([]);
    }
  };

  // Initialisation de l'authentification
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          if (mounted) {
            setError(`Erreur de session: ${error.message}`);
            setLoading(false);
          }
          return;
        }
        
        console.log('✅ Session retrieved:', !!currentSession);
        
        if (mounted) {
          setSession(currentSession);
          
          if (currentSession) {
            console.log('📊 Loading initial data...');
            // Charger les données de manière non-bloquante
            await Promise.allSettled([
              loadSalesReps(),
              loadRFPs(),
              loadProspects(),
              loadClientNeeds()
            ]);
            console.log('✅ Data loading completed');
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Critical error during initialization:', error);
        if (mounted) {
          setError(`Erreur critique: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, !!session);
      
      if (mounted) {
        setSession(session);
        if (event === 'SIGNED_IN' && session) {
          // Recharger les données lors de la connexion
          await Promise.allSettled([
            loadSalesReps(),
            loadRFPs(),
            loadProspects(),
            loadClientNeeds()
          ]);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handler pour analyser un RFP
  const handleAnalyzeRFP = async (content: string, assignedTo: string) => {
    try {
      setIsAnalyzing(true);
      console.log('🔍 Analyzing RFP...');
      
      // Import dynamique pour éviter les erreurs de dépendance
      const { analyzeRFP } = await import('./services/openai');
      const analysisResult = await analyzeRFP(content);
      
      // Créer le RFP directement avec Supabase
      const { data, error } = await supabase
        .from('rfps')
        .insert([{
          client: analysisResult.client || 'Non spécifié',
          mission: analysisResult.mission || 'Non spécifié', 
          location: analysisResult.location || 'Non spécifié',
          max_rate: analysisResult.maxRate,
          created_at: analysisResult.createdAt || new Date().toISOString(),
          start_date: analysisResult.startDate,
          status: 'À traiter',
          assigned_to: assignedTo,
          raw_content: content,
          is_read: false,
          comments: ''
        }])
        .select('*')
        .single();

      if (error) throw error;
      
      if (data) {
        const newRFP: RFP = {
          id: data.id,
          client: data.client,
          mission: data.mission,
          location: data.location,
          maxRate: data.max_rate,
          createdAt: data.created_at,
          startDate: data.start_date,
          status: data.status,
          assignedTo: data.assigned_to,
          content: data.raw_content,
          isRead: data.is_read,
          comments: data.comments || ''
        };
        
        setRfps(prev => [newRFP, ...prev]);
      }
      
      console.log('✅ RFP analyzed and created');
    } catch (error) {
      console.error('❌ Error analyzing RFP:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

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
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Chargement de l'application...</span>
        </div>
      </div>
    );
  }

  // Écran de connexion
  if (!session) {
    return <LoginForm onLoginSuccess={setSession} />;
  }

  // Application principale avec gestion d'erreur simplifiée
  try {
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
                  salesReps={salesReps}
                  onAnalyzeRFP={handleAnalyzeRFP}
                  isAnalyzing={isAnalyzing}
                  
                  // Handlers simplifiés pour éviter les erreurs
                  onStatusChange={async (id, status) => {
                    try {
                      const { error } = await supabase
                        .from('rfps')
                        .update({ status })
                        .eq('id', id);
                      
                      if (!error) {
                        setRfps(prev => prev.map(rfp => 
                          rfp.id === id ? { ...rfp, status } : rfp
                        ));
                      }
                    } catch (error) {
                      console.error('Error updating status:', error);
                    }
                  }}
                  
                  onCommentsChange={async (id, comments) => {
                    console.log('💬 Updating comments for:', id);
                    // Mise à jour optimiste
                    setRfps(prev => prev.map(rfp => 
                      rfp.id === id ? { ...rfp, comments } : rfp
                    ));
                    
                    try {
                      const { error } = await supabase
                        .from('rfps')
                        .update({ comments })
                        .eq('id', id);
                      
                      if (error) {
                        console.error('Error saving comments:', error);
                      } else {
                        console.log('✅ Comments saved successfully');
                      }
                    } catch (error) {
                      console.error('Error in comments update:', error);
                    }
                  }}
                  
                  onView={async (rfp) => {
                    try {
                      await supabase
                        .from('rfps')
                        .update({ is_read: true })
                        .eq('id', rfp.id);
                      
                      setRfps(prev => prev.map(r => 
                        r.id === rfp.id ? { ...r, isRead: true } : r
                      ));
                    } catch (error) {
                      console.error('Error marking as read:', error);
                    }
                  }}
                  
                  onDelete={async (id) => {
                    try {
                      const { error } = await supabase
                        .from('rfps')
                        .delete()
                        .eq('id', id);
                      
                      if (!error) {
                        setRfps(prev => prev.filter(rfp => rfp.id !== id));
                      }
                    } catch (error) {
                      console.error('Error deleting RFP:', error);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('💥 Render error:', error);
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-red-800 font-semibold mb-2">Erreur de rendu</h2>
          <p className="text-red-600 text-sm">L'application ne peut pas s'afficher correctement.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }
}

export default App;