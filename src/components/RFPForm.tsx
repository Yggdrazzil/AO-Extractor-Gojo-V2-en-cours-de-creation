import React, { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SalesRep } from '../types';
import { supabase } from '../services/api/supabaseClient';

interface RFPFormProps {
  salesReps: SalesRep[];
  onSubmit: (content: string, assignedTo: string) => Promise<void>;
  isLoading?: boolean;
}

export function RFPForm({ salesReps, onSubmit, isLoading = false }: RFPFormProps) {
  const [content, setContent] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const initializeExpansionState = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email;
        setUserEmail(email);

        if (email) {
          const storageKey = `rfpFormExpanded_${email}`;
          const savedState = localStorage.getItem(storageKey);
          setIsExpanded(savedState === null ? true : savedState === 'true');
        }
      } catch (error) {
        console.error('Error initializing expansion state:', error);
      }
    };

    initializeExpansionState();
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;
      if (userEmail) {
        const storageKey = `rfpFormExpanded_${userEmail}`;
        localStorage.setItem(storageKey, String(newState));
      }
      return newState;
    });
  }, [userEmail]);

  React.useEffect(() => {
    console.log('RFPForm props updated:', {
      hasSalesReps: salesReps?.length > 0,
      salesRepsCount: salesReps?.length,
      salesReps: salesReps?.map(rep => `${rep.code} (${rep.id})`)
    });
  }, [salesReps]);

  console.log('RFPForm render:', {
    hasReps: salesReps?.length > 0,
    repCount: salesReps?.length
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (!content.trim()) {
        setError("Le contenu de l'AO est requis");
        return;
      }
      if (!assignedTo) {
        setError("Veuillez sélectionner un commercial");
        return;
      }
      
      await onSubmit(content, assignedTo);
      setContent('');
      setAssignedTo('');
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div 
        className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Texte de l'Appel d'Offres
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
      
      <div className={`p-6 space-y-4 transition-all duration-200 ease-in-out ${
        isExpanded ? 'block' : 'hidden'
      }`}>
        <div className="space-y-4">
          <div className="space-y-2">
            <textarea
              id="rfp-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-40 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
              placeholder="Collez ici le texte de l'appel d'offres..."
            />
            {error && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <select
              value={assignedTo}
              onChange={(e) => {
                console.log('Sales rep selected:', {
                  value: e.target.value,
                  availableReps: salesReps?.length
                });
                console.log('Selected sales rep:', e.target.value);
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
              }).map((rep) => {
                return (
                  <option key={rep.id} value={rep.id}>
                    {rep.code} - {rep.name}
                  </option>
                );
              })}
            </select>
          
            <button
              type="submit"
              disabled={isLoading || !content.trim() || !assignedTo}
              className="w-full sm:w-auto px-6 py-2 bg-[#1651EE] hover:bg-[#1651EE]/90 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Analyse...' : 'Analyser'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}