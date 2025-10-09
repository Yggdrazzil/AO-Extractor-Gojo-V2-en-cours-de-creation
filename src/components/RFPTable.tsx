import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { RFP, SalesRep } from '../types';
import { Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Check, X, Users, MessageSquare } from 'lucide-react';
import { RFPContentModal } from './RFPContentModal';
import { LinkedInModal } from './LinkedInModal';
import { RFPCommentsModal } from './RFPCommentsModal';
import { ConfirmDialog } from './common/ConfirmDialog';
import { getLinkedInLinkCounts } from '../services/linkedin';
import { VirtualizedTable } from './VirtualizedTable';

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
  onStartDateChange: (id: string, startDate: string) => Promise<void>;
  onCreatedAtChange: (id: string, createdAt: string) => Promise<void>;
  onCommentsChange: (id: string, comments: string) => Promise<void>;
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
  onStartDateChange,
  onCreatedAtChange,
  onCommentsChange,
  onView,
  onDelete,
}: RFPTableProps) {
  const statusOptions: RFP['status'][] = ['À traiter', 'Traité'];
  const [sort, setSort] = useState<SortState>({ field: null, direction: null });
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('');
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [selectedRFP, setSelectedRFP] = useState<RFP | null>(null);
  const [selectedRFPForLinkedIn, setSelectedRFPForLinkedIn] = useState<string | null>(null);
  const [selectedRFPForComments, setSelectedRFPForComments] = useState<RFP | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [urlCounts, setUrlCounts] = useState<Map<string, number>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; rfpId: string; rfpTitle: string }>({
    isOpen: false,
    rfpId: '',
    rfpTitle: ''
  });

  // Charger le nombre d'URLs LinkedIn pour chaque AO
  useEffect(() => {
    const loadUrlCounts = async () => {
      try {
        const counts = await getLinkedInLinkCounts();
        setUrlCounts(counts);
      } catch (error) {
        console.error('Error loading LinkedIn URL counts:', error);
        setUrlCounts(new Map());
      }
    };

    loadUrlCounts();
  }, [rfps]);

  // Effet pour initialiser le filtre avec le commercial connecté
  useEffect(() => {
    const initializeUserFilter = async () => {
      try {
        const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession());
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
        const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession());
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
    
    // Filtrage par commercial
    if (selectedSalesRep) {
      filtered = rfps.filter(rfp => rfp.assignedTo === selectedSalesRep);
    }
    
    // Filtrage par recherche textuelle
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(rfp => 
        rfp.client.toLowerCase().includes(searchLower) ||
        rfp.mission.toLowerCase().includes(searchLower) ||
        rfp.location.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [rfps, selectedSalesRep, searchTerm]);

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

  const handleViewRFP = async (rfp: RFP) => {
    await onView(rfp);
    setSelectedRFP(rfp);
  };
  
  const handleDeleteClick = (rfp: RFP) => {
    setDeleteConfirm({
      isOpen: true,
      rfpId: rfp.id,
      rfpTitle: `${rfp.mission} - ${rfp.client}`
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.rfpId) {
      await onDelete(deleteConfirm.rfpId);
      setDeleteConfirm({ isOpen: false, rfpId: '', rfpTitle: '' });
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
    <div className="space-y-6">
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
      <RFPCommentsModal
        isOpen={!!selectedRFPForComments}
        onClose={() => setSelectedRFPForComments(null)}
        rfp={selectedRFPForComments || { id: '', client: '', mission: '', comments: '' }}
        onSave={onCommentsChange}
      />
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex flex-col space-y-4">
          {/* Première ligne : Filtres */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="sales-rep-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filtrer par commercial :
              </label>
              <select
                id="sales-rep-filter"
                value={selectedSalesRep}
                onChange={(e) => handleSalesRepChange(e.target.value)}
                className="w-full sm:w-56 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les commerciaux</option>
                {[...salesReps].sort((a, b) => {
                  const order = ['EPO', 'IKH', 'BVI', 'GMA', 'TSA', 'BCI', 'VIE', 'JVO'];
                  return order.indexOf(a.code) - order.indexOf(b.code);
                }).map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.code} - {rep.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2 flex-1">
              <label htmlFor="search-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Rechercher :
              </label>
              <input
                id="search-filter"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Client, mission, localisation..."
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Effacer la recherche"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div
        ref={tableRef}
        className="table-scroll-container w-full max-h-[70vh]"
        >
        <table className="w-full border-collapse">
          <thead className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr className="text-left">
              <th className="w-[4%] bg-white dark:bg-gray-800" />
              <th
                className="w-[11%] font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none bg-white dark:bg-gray-800"
                onClick={() => handleSort('client')}
              >
                <div className="flex items-center gap-1">
                  Client
                  {getSortIcon('client')}
                </div>
              </th>
              <th
                className="w-[14%] font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none bg-white dark:bg-gray-800"
                onClick={() => handleSort('mission')}
              >
                <div className="flex items-center gap-1">
                  Intitulé Mission
                  {getSortIcon('mission')}
                </div>
              </th>
              <th
                className="w-[10%] font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none bg-white dark:bg-gray-800"
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center gap-1">
                  Localisation
                  {getSortIcon('location')}
                </div>
              </th>
              <th
                className="w-[8%] font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none bg-white dark:bg-gray-800"
                onClick={() => handleSort('maxRate')}
              >
                <div className="flex items-center gap-1">
                  TJM Max
                  {getSortIcon('maxRate')}
                </div>
              </th>
              <th
                className="w-[11%] font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none bg-white dark:bg-gray-800"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  Date Création
                  {getSortIcon('createdAt')}
                </div>
              </th>
              <th
                className="w-[12%] font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none bg-white dark:bg-gray-800"
                onClick={() => handleSort('startDate')}
              >
                <div className="flex items-center gap-1">
                  Date Démarrage
                  {getSortIcon('startDate')}
                </div>
              </th>
              <th className="w-[10%] font-medium text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800">Statut</th>
              <th className="w-[10%] font-medium text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800">Commercial</th>
              <th className="w-[10%] font-medium text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-800">Actions</th>
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
                <td className="p-2 sm:p-4">
                  <button
                    onClick={() => onView(rfp)}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105 hover:shadow-md ${
                      rfp.isRead
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800'
                    }`}
                    title={rfp.isRead ? 'Cliquer pour marquer comme non lu' : 'Cliquer pour marquer comme lu'}
                  >
                    {rfp.isRead ? 'Lu' : 'NEW'}
                  </button>
                </td>
                <td className="p-2 sm:p-4 text-gray-900 dark:text-gray-100">
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
                      onClick={() => handleViewRFP(rfp)}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedRFPForLinkedIn(rfp.id)}
                      title="Prospects LinkedIn"
                      className="relative p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <Users className="w-5 h-5" />
                      {urlCounts.get(rfp.id) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {urlCounts.get(rfp.id)}
                        </span>
                      )}
                    </button>
                    <div className="relative group overflow-visible">
                      <button
                        onClick={() => setSelectedRFPForComments(rfp)}
                        title="Commentaires"
                        className="relative p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <MessageSquare className="w-5 h-5" />
                        {rfp.comments && rfp.comments.trim() && (
                          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            !
                          </span>
                        )}
                      </button>
                      {rfp.comments && rfp.comments.trim() && (
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-[9999] pointer-events-none">
                          <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg p-3 w-96 max-h-60 overflow-y-auto whitespace-pre-wrap break-words">
                            {rfp.comments}
                            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteClick(rfp)}
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
      
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, rfpId: '', rfpTitle: '' })}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer cet AO ?\n\n"${deleteConfirm.rfpTitle}"\n\nCette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isDestructive={true}
      />
    </div>
  );
}