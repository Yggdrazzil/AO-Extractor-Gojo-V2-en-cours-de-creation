import React, { useState } from 'react';
import type { RFP, SalesRep } from '../types';
import { Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Check, X, Users } from 'lucide-react';
import { RFPContentModal } from './RFPContentModal';
import { LinkedInModal } from './LinkedInModal';
import { useMemo, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface LinkedInUrlCount {
  rfp_id: string;
  count: number;
}

interface EditingField {
  id: string;
  value: string;
  field: 'client' | 'mission' | 'location' | 'maxRate' | 'startDate' | 'createdAt';
}

type SortField = 'client' | 'mission' | 'location' | 'maxRate' | 'createdAt' | 'startDate';
type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

function formatTableDate(dateStr: string): string {
  if (!dateStr) return 'Non spécifié';
  
  // Nettoyer la chaîne de caractères
  const cleanDateStr = dateStr.trim();
  
  // Format JJ/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDateStr)) {
    return cleanDateStr;
  }
  
  // Format ISO
  try {
    const date = new Date(cleanDateStr);
    if (isNaN(date.getTime())) return 'Non spécifié';
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', { dateStr: cleanDateStr, error: e });
    return 'Non spécifié';
  }
}

interface RFPTableProps {
  rfps: RFP[];
  salesReps: SalesRep[];
  onStatusChange: (id: string, status: RFP['status']) => Promise<void>;
  onAssigneeChange: (id: string, assignedTo: string) => Promise<void>;
  onClientChange: (id: string, client: string) => Promise<void>;
  onMissionChange: (id: string, mission: string) => Promise<void>;
  onLocationChange: (id: string, location: string) => Promise<void>;
  onMaxRateChange: (id: string, maxRate: string) => Promise<void>;
  onToggleRead: (id: string, isRead: boolean) => Promise<void>;
  onStartDateChange: (id: string, startDate: string) => Promise<void>;
  onCreatedAtChange: (id: string, createdAt: string) => Promise<void>;
  onView: (rfp: RFP) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function RFPTable({
  rfps,
  salesReps,
  onStatusChange,
  onAssigneeChange,
  onClientChange,
  onMissionChange,
  onLocationChange,
  onMaxRateChange,
  onToggleRead,
  onStartDateChange,
  onCreatedAtChange,
  onView,
  onDelete,
}: RFPTableProps) {
  const statusOptions: RFP['status'][] = ['À traiter', 'Traité'];
  const [sort, setSort] = useState<SortState>({ field: null, direction: null });
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('');
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [selectedRFP, setSelectedRFP] = useState<RFP | null>(null);
  const [selectedRFPForLinkedIn, setSelectedRFPForLinkedIn] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [urlCounts, setUrlCounts] = useState<Map<string, number>>(new Map());

  // Charger le nombre d'URLs LinkedIn pour chaque AO
  useEffect(() => {
    const loadUrlCounts = async () => {
      try {
        // Vérifier la session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('No active session, skipping URL count fetch');
          return;
        }

        const { data, error } = await supabase
          .from('linkedin_links')
          .select('rfp_id');

        if (error) throw error;
        if (!data) return;

        const newCounts = new Map<string, number>();
        // Compter les occurrences de chaque rfp_id
        data.forEach((link) => {
          const count = newCounts.get(link.rfp_id) || 0;
          newCounts.set(link.rfp_id, count + 1);
        });

        setUrlCounts(newCounts);
      } catch (error) {
        console.error('Error loading LinkedIn URL counts:', error);
        // Ne pas bloquer l'interface en cas d'erreur
        setUrlCounts(new Map());
      }
    };

    loadUrlCounts();
  }, [rfps]);

  // Effet pour initialiser le filtre avec le commercial connecté
  useEffect(() => {
    const initializeUserFilter = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) {
          console.warn('No user session found');
          return;
        }

        const userEmail = session.user.email;
        const storageKey = `selectedSalesRep_${userEmail}`;
        
        // Récupérer la sélection sauvegardée pour cet utilisateur
        const savedSelection = localStorage.getItem(storageKey);

        if (savedSelection) {
          setSelectedSalesRep(savedSelection);
        } else {
          const emailCode = userEmail.split('@')[0].split('.')[0].toUpperCase();
          const matchingSalesRep = salesReps.find(rep => rep.code === emailCode.substring(0, 3));

          if (matchingSalesRep) {
            setSelectedSalesRep(matchingSalesRep.id);
            localStorage.setItem(storageKey, matchingSalesRep.id);
          }
        }
      } catch (error) {
        console.error('Error initializing user filter:', error);
      }
    };

    initializeUserFilter();
  }, [salesReps]);

  const handleSalesRepChange = (value: string) => {
    const saveSelection = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const storageKey = `selectedSalesRep_${session.user.email}`;
          localStorage.setItem(storageKey, value);
          setSelectedSalesRep(value);
        }
      } catch (error) {
        console.error('Error saving selection:', error);
      }
    };
    
    saveSelection();
  };

  const salesRepsMap = useMemo(() => {
    const map = new Map<string, string>();
    salesReps.forEach(rep => map.set(rep.id, rep.code));
    return map;
  }, [salesReps]);

  const filteredRfps = useMemo(() => {
    let filtered = rfps;
    if (selectedSalesRep) {
      filtered = rfps.filter(rfp => rfp.assignedTo === selectedSalesRep);
    }
    return filtered;
  }, [rfps, selectedSalesRep]);

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field
        ? prev.direction === 'asc'
          ? 'desc'
          : prev.direction === 'desc'
            ? null
            : 'asc'
        : 'asc'
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sort.field !== field) return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    if (sort.direction === 'asc') return <ArrowUp className="w-4 h-4" />;
    if (sort.direction === 'desc') return <ArrowDown className="w-4 h-4" />;
    return <ArrowUpDown className="w-4 h-4 opacity-50" />;
  };

  const sortedRfps = useMemo(() => {
    if (!sort.field || !sort.direction) return filteredRfps;

    return [...filteredRfps].sort((a, b) => {
      const direction = sort.direction === 'asc' ? 1 : -1;

      switch (sort.field) {
        case 'maxRate':
          const rateA = a.maxRate || 0;
          const rateB = b.maxRate || 0;
          return (rateA - rateB) * direction;

        case 'createdAt':
        case 'startDate':
          const dateA = a[sort.field] ? new Date(a[sort.field]!).getTime() : 0;
          const dateB = b[sort.field] ? new Date(b[sort.field]!).getTime() : 0;
          return (dateA - dateB) * direction;

        default:
          const valA = (a[sort.field] || '').toLowerCase();
          const valB = (b[sort.field] || '').toLowerCase();
          return valA.localeCompare(valB) * direction;
      }
    });
  }, [filteredRfps, sort]);

  const handleEdit = (rfp: RFP, field: EditingField['field']) => {
    let value = '';
    switch (field) {
      case 'maxRate':
        value = rfp.maxRate?.toString() || '';
        break;
      case 'startDate':
      case 'createdAt':
        if (rfp[field]) {
          const date = new Date(rfp[field]!);
          value = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        }
        break;
      default:
        value = rfp[field];
    }
    setEditingField({ id: rfp.id, value, field });
  };

  const handleSave = async () => {
    if (editingField) {
      try {
        const { id, value, field } = editingField;
        if (!id) {
          console.error('No RFP ID provided for update');
          return;
        }

        if (editingField.field === 'client') { 
          await onClientChange(id, value);
        } else if (editingField.field === 'mission') {
          await onMissionChange(id, value);
        } else if (editingField.field === 'location') {
          await onLocationChange(id, value);
        } else if (editingField.field === 'maxRate') {
          await onMaxRateChange(id, value);
        } else if (editingField.field === 'startDate') {
          await onStartDateChange(id, value);
        } else if (editingField.field === 'createdAt') {
          await onCreatedAtChange(id, value);
        }
      } catch (error) {
        console.error(`Failed to update ${editingField.field}:`, error);
        // Ne pas masquer l'erreur à l'utilisateur
        alert(`Erreur lors de la mise à jour de ${editingField.field}`);
      }
      setEditingField(null);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  useEffect(() => {
    const tableElement = tableRef.current;
    if (!tableElement) return;

    let scrollTimeout: number;

    const handleScroll = () => {
      if (!isScrolling) {
        setIsScrolling(true);
      }
      
      window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    tableElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (tableElement) {
        tableElement.removeEventListener('scroll', handleScroll);
      }
      window.clearTimeout(scrollTimeout);
    };
  }, [isScrolling]);

  return (
    <div className="space-y-4">
      <RFPContentModal
        isOpen={!!selectedRFP}
        onClose={() => setSelectedRFP(null)}
        content={selectedRFP?.content || ''}
        client={selectedRFP?.client || ''}
        mission={selectedRFP?.mission || ''}
      />
      <LinkedInModal
        isOpen={!!selectedRFPForLinkedIn}
        onClose={() => setSelectedRFPForLinkedIn(null)}
        rfpId={selectedRFPForLinkedIn || ''}
        onUrlCountChange={(count) => {
          const newCounts = new Map(urlCounts);
          if (selectedRFPForLinkedIn) {
            if (count > 0) {
              newCounts.set(selectedRFPForLinkedIn, count);
            } else {
              newCounts.delete(selectedRFPForLinkedIn);
            }
            setUrlCounts(newCounts);
          }
        }}
      />
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <label htmlFor="sales-rep-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrer par commercial :
          </label>
          <select
            id="sales-rep-filter"
            value={selectedSalesRep}
            onChange={(e) => handleSalesRepChange(e.target.value)}
            className="w-56 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les commerciaux</option>
            {[...salesReps].sort((a, b) => {
              const order = ['IKH', 'BVI', 'GMA', 'TSA', 'EPO', 'BCI', 'VIE'];
              return order.indexOf(a.code) - order.indexOf(b.code);
            }).map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.code}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div 
        ref={tableRef}
        className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm max-h-[70vh] overscroll-contain"
        style={{ 
          willChange: isScrolling ? 'transform' : 'auto',
          contain: 'content'
        }}
      >
        <table className="w-full border-collapse">
          <thead className="bg-white dark:bg-gray-800 sticky top-0 z-10">
            <tr className="text-left">
              <th className="p-4 w-16" />
              <th 
                className="p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none"
                onClick={() => handleSort('client')}
              >
                <div className="flex items-center gap-2">
                  Client
                  {getSortIcon('client')}
                </div>
              </th>
              <th 
                className="p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none"
                onClick={() => handleSort('mission')}
              >
                <div className="flex items-center gap-2">
                  Intitulé Mission
                  {getSortIcon('mission')}
                </div>
              </th>
              <th 
                className="p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none"
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center gap-2">
                  Localisation
                  {getSortIcon('location')}
                </div>
              </th>
              <th 
                className="p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none"
                onClick={() => handleSort('maxRate')}
              >
                <div className="flex items-center gap-2">
                  TJM Max
                  {getSortIcon('maxRate')}
                </div>
              </th>
              <th 
                className="p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-2">
                  Date Création
                  {getSortIcon('createdAt')}
                </div>
              </th>
              <th 
                className="p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none"
                onClick={() => handleSort('startDate')}
              >
                <div className="flex items-center gap-2">
                  Date Démarrage
                  {getSortIcon('startDate')}
                </div>
              </th>
              <th className="p-4 font-medium text-gray-600 dark:text-gray-200">Statut</th>
              <th className="p-4 font-medium text-gray-600 dark:text-gray-200">Commercial</th>
              <th className="p-4 font-medium text-gray-600 dark:text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRfps.map((rfp) => (
              <tr 
                key={rfp.id} 
                className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 group ${
                  rfp.status === 'Traité' ? 'bg-gray-200 dark:bg-gray-900' : 'dark:bg-gray-600'
                }`}
              >
                <td 
                  className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRead(rfp.id, !rfp.isRead);
                  }}
                  title={rfp.isRead ? "Marquer comme non lu" : "Marquer comme lu"}
                >
                  <span 
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-opacity ${
                      !rfp.isRead 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 opacity-100' 
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 opacity-50 hover:opacity-100'
                    }`}
                  >
                    {rfp.isRead ? 'Lu' : 'New'}
                  </span>
                </td>
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === rfp.id && editingField.field === 'client' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        autoFocus
                      />
                      <button
                        onClick={handleSave}
                        className="p-1 text-green-600 hover:text-green-700 dark:text-green-400"
                        title="Sauvegarder"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Annuler"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleEdit(rfp, 'client')}
                      className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      title="Cliquer pour modifier"
                    >
                      {rfp.client}
                    </div>
                  )}
                </td>
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === rfp.id && editingField.field === 'mission' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        autoFocus
                      />
                      <button
                        onClick={handleSave}
                        className="p-1 text-green-600 hover:text-green-700 dark:text-green-400"
                        title="Sauvegarder"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Annuler"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleEdit(rfp, 'mission')}
                      className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      title="Cliquer pour modifier"
                    >
                      {rfp.mission}
                    </div>
                  )}
                </td>
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === rfp.id && editingField.field === 'location' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        autoFocus
                      />
                      <button
                        onClick={handleSave}
                        className="p-1 text-green-600 hover:text-green-700 dark:text-green-400"
                        title="Sauvegarder"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Annuler"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleEdit(rfp, 'location')}
                      className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      title="Cliquer pour modifier"
                    >
                      {rfp.location}
                    </div>
                  )}
                </td>
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === rfp.id && editingField.field === 'maxRate' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        min="0"
                        step="1"
                        autoFocus
                      />
                      <button
                        onClick={handleSave}
                        className="p-1 text-green-600 hover:text-green-700 dark:text-green-400"
                        title="Sauvegarder"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Annuler"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleEdit(rfp, 'maxRate')}
                      className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      title="Cliquer pour modifier"
                    >
                      {typeof rfp.maxRate === 'number' ? `${rfp.maxRate}€` : '-'}
                    </div>
                  )}
                </td>
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === rfp.id && editingField.field === 'createdAt' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        placeholder="JJ/MM/AAAA"
                        autoFocus
                      />
                      <button
                        onClick={handleSave}
                        className="p-1 text-green-600 hover:text-green-700 dark:text-green-400"
                        title="Sauvegarder"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Annuler"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleEdit(rfp, 'createdAt')}
                      className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      title="Cliquer pour modifier"
                    >
                      {formatTableDate(rfp.createdAt)}
                    </div>
                  )}
                </td>
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === rfp.id && editingField.field === 'startDate' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        placeholder="JJ/MM/AAAA"
                        autoFocus
                      />
                      <button
                        onClick={handleSave}
                        className="p-1 text-green-600 hover:text-green-700 dark:text-green-400"
                        title="Sauvegarder"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Annuler"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleEdit(rfp, 'startDate')}
                      className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      title="Cliquer pour modifier"
                    >
                      {formatTableDate(rfp.startDate)}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <select
                    value={rfp.status}
                    onChange={(e) => onStatusChange(rfp.id, e.target.value as RFP['status'])}
                    className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {salesRepsMap.get(rfp.assignedTo) || '---'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        onView(rfp)
                        .then(() => {
                          const updatedRfp = { ...rfp, isRead: true };
                          setSelectedRFP(rfp);
                        })
                        .catch(error => {
                          console.error('Error viewing RFP:', error);
                        });
                      }}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedRFPForLinkedIn(rfp.id)}
                      title="Gérer les prospects LinkedIn" 
                      className="relative p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <Users className="w-5 h-5" />
                      {urlCounts.get(rfp.id) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {urlCounts.get(rfp.id)}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => onDelete(rfp.id)}
                      title="Supprimer"
                      className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}