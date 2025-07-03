import React, { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Upload, X, RefreshCw, AlertCircle } from 'lucide-react';
import { SalesRep } from '../types';
import { supabase } from '../lib/supabase';
import { fetchOpenNeeds, testBoondmanagerConnection, type BoondmanagerNeed } from '../services/boondmanager';

interface BoondmanagerProspectsFormProps {
  salesReps: SalesRep[];
  onSubmit: (textContent: string, selectedNeedId: string, selectedNeedTitle: string, file: File | null, assignedTo: string) => Promise<void>;
  isLoading?: boolean;
}

export function BoondmanagerProspectsForm({ salesReps, onSubmit, isLoading = false }: BoondmanagerProspectsFormProps) {
  const [textContent, setTextContent] = useState('');
  const [selectedNeedId, setSelectedNeedId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assignedTo, setAssignedTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [openNeeds, setOpenNeeds] = useState<BoondmanagerNeed[]>([]);
  const [needsLoading, setNeedsLoading] = useState(false);
  const [needsError, setNeedsError] = useState<string | null>(null);
  const [isRealMode, setIsRealMode] = useState(false);

  // Besoins simulés pour le mode démo
  const mockNeeds = [
    {
      id: 'need-1',
      title: 'Développeur Full Stack React/Node.js',
      client: 'TechCorp Solutions',
      description: 'Recherche d\'un développeur expérimenté pour projet e-commerce'
    },
    {
      id: 'need-2', 
      title: 'Consultant SAP Finance',
      client: 'Global Industries',
      description: 'Mission de 6 mois pour implémentation module FI/CO'
    },
    {
      id: 'need-3',
      title: 'Chef de Projet Digital',
      client: 'Innovation Labs',
      description: 'Pilotage transformation digitale secteur bancaire'
    },
    {
      id: 'need-4',
      title: 'Architecte Cloud AWS',
      client: 'CloudFirst Inc',
      description: 'Migration infrastructure vers AWS et formation équipes'
    }
  ];

  useEffect(() => {
    const initializeExpansionState = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email;
        setUserEmail(email);

        if (email) {
          const storageKey = `boondmanagerProspectsFormExpanded_${email}`;
          const savedState = localStorage.getItem(storageKey);
          setIsExpanded(savedState === null ? true : savedState === 'true');
        }
      } catch (error) {
        console.error('Error initializing expansion state:', error);
      }
    };

    initializeExpansionState();
  }, []);

  useEffect(() => {
    // Vérifier si on a une configuration Boondmanager
    const hasConfig = localStorage.getItem('boondmanager-client-token') && 
                     localStorage.getItem('boondmanager-client-key') && 
                     localStorage.getItem('boondmanager-user-token');
    
    if (hasConfig) {
      setIsRealMode(true);
      loadOpenNeeds();
    }
  }, []);

  const loadOpenNeeds = async () => {
    setNeedsLoading(true);
    setNeedsError(null);
    
    try {
      // Vérifier d'abord la connexion
      const isConnected = await testBoondmanagerConnection();
      if (!isConnected) {
        throw new Error('Impossible de se connecter à Boondmanager. Vérifiez la configuration dans les paramètres.');
      }
      
      const needs = await fetchOpenNeeds();
      console.log('Loaded needs from Boondmanager:', needs.length);
      setOpenNeeds(needs);
      setIsRealMode(true);
    } catch (error) {
      console.error('Error loading open needs:', error);
      setNeedsError(error instanceof Error ? error.message : 'Erreur lors du chargement des besoins');
      setOpenNeeds([]);
      setIsRealMode(false);
    } finally {
      setNeedsLoading(false);
    }
  };

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;
      if (userEmail) {
        const storageKey = `boondmanagerProspectsFormExpanded_${userEmail}`;
        localStorage.setItem(storageKey, String(newState));
      }
      return newState;
    });
  }, [userEmail]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Seuls les fichiers PDF et Word sont acceptés');
        e.target.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Seuls les fichiers PDF et Word sont acceptés');
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (!textContent.trim() && !selectedFile) {
        setError("Veuillez saisir du texte ou joindre un fichier");
        return;
      }
      if (!selectedNeedId) {
        setError("Veuillez sélectionner un besoin");
        return;
      }
      if (!assignedTo) {
        setError("Veuillez sélectionner un commercial");
        return;
      }
      
      const needsList = isRealMode ? openNeeds : mockNeeds;
      const selectedNeed = needsList.find(need => need.id === selectedNeedId);
      const selectedNeedTitle = selectedNeed ? `${selectedNeed.client} - ${selectedNeed.title}` : 'Besoin non trouvé';
      
      await onSubmit(textContent, selectedNeedId, selectedNeedTitle, selectedFile, assignedTo);
      setTextContent('');
      setSelectedNeedId('');
      setSelectedFile(null);
      setAssignedTo('');
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  const needsList = isRealMode ? openNeeds : mockNeeds;
  const selectedNeed = needsList.find(need => need.id === selectedNeedId);

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Profils pour besoins Boondmanager
        </h2>
        <button
          type="button"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          onClick={(e) => {
            e.preventDefault();
            toggleExpand();
          }}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
        </button>
      </div>
      
      <div className={`p-6 space-y-6 transition-all duration-200 ease-in-out ${
        isExpanded ? 'block' : 'hidden'
      }`}>
        {/* Indicateur de mode */}
        {!isRealMode && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-amber-800 dark:text-amber-200 text-sm">
              <div className="font-medium mb-1">Mode démonstration</div>
              <div>Configurez vos tokens Boondmanager dans les paramètres pour accéder aux vrais besoins.</div>
            </div>
          </div>
        )}

        {/* Champ texte */}
        <div className="space-y-2">
          <label htmlFor="text-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Informations textuelles
          </label>
          <textarea
            id="text-content"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full h-32 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
            placeholder="Collez ici les informations sur les profils à analyser..."
          />
        </div>

        {/* Sélection du besoin Boondmanager */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="selected-need" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {isRealMode ? 'Besoin Boondmanager' : 'Besoin client (exemples)'}
            </label>
            {isRealMode && (
              <button
                type="button"
                onClick={loadOpenNeeds}
                disabled={needsLoading}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${needsLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            )}
          </div>
          
          {needsError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-red-700 dark:text-red-300 text-sm">
                {needsError}
              </div>
            </div>
          )}
          
          <select
            id="selected-need"
            value={selectedNeedId}
            onChange={(e) => setSelectedNeedId(e.target.value)}
            disabled={needsLoading || (isRealMode && openNeeds.length === 0)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50"
          >
            <option value="">
              {needsLoading ? 'Chargement des besoins...' : 
               (isRealMode && openNeeds.length === 0) ? 'Aucun besoin disponible' : 
               'Sélectionner un besoin'}
            </option>
            {needsList.map((need) => (
              <option key={need.id} value={need.id}>
                {need.client} - {need.title}
              </option>
            ))}
          </select>
          
          {selectedNeed && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                {selectedNeed.client} - {selectedNeed.title}
              </h4>
              {selectedNeed.description && (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedNeed.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Zone de dépôt de fichier */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Pièce jointe (PDF ou Word)
          </label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {selectedFile ? (
              <div className="flex items-center justify-between w-full p-6 min-h-[120px]">
                <div className="flex items-center space-x-3">
                  <Upload className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-center p-6 min-h-[120px] flex flex-col justify-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Glissez-déposez un fichier ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  PDF, DOC, DOCX jusqu'à 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded-lg">
            {error}
          </div>
        )}

        {/* Sélection du commercial et bouton d'analyse */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <select
            value={assignedTo}
            onChange={(e) => {
              setAssignedTo(e.target.value);
              setError(null);
            }}
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            <option value="">
              {salesReps?.length ? 'Sélectionner un commercial' : 'Aucun commercial disponible'}
            </option>
            {[...salesReps].sort((a, b) => {
              const order = ['EPO', 'IKH', 'BVI', 'GMA', 'TSA', 'BCI', 'VIE', 'JVO'];
              return order.indexOf(a.code) - order.indexOf(b.code);
            }).map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.code} - {rep.name}
              </option>
            ))}
          </select>
        
          <button
            type="submit"
            disabled={isLoading || (!textContent.trim() && !selectedFile) || !selectedNeedId || !assignedTo}
            className="w-full sm:w-auto px-6 py-2 bg-[#1651EE] hover:bg-[#1651EE]/90 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Analyse...' : 'Analyser'}
          </button>
        </div>
      </div>
    </form>
  );
}