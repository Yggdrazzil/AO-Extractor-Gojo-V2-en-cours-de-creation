import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { BoondmanagerProspect, SalesRep } from '../types';
import { Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Check, X, Download, MessageSquare } from 'lucide-react';
import { ProspectContentModal } from './ProspectContentModal';
import { ClientNeedCommentsModal } from './ClientNeedCommentsModal';
import { ConfirmDialog } from './common/ConfirmDialog';

interface EditingField {
  id: string;
  value: string;
  field: 'besoin' | 'availability' | 'dailyRate' | 'residence' | 'mobility' | 'phone' | 'email';
}

type SortField = 'besoin' | 'availability' | 'dailyRate' | 'residence' | 'mobility' | 'phone' | 'email';
type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

function formatTableDate(dateStr: string): string {
  if (!dateStr) return 'Non spécifié';
  
  const cleanDateStr = dateStr.trim();
  
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDateStr)) {
    return cleanDateStr;
  }
  
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

interface ClientNeedsTableProps {
  prospects: BoondmanagerProspect[];
  salesReps: SalesRep[];
  onStatusChange: (id: string, status: BoondmanagerProspect['status']) => Promise<void>;
  onAssigneeChange: (id: string, assignedTo: string) => Promise<void>;
  onSelectedNeedChange: (id: string, besoin: string) => Promise<void>;
  onAvailabilityChange: (id: string, availability: string) => Promise<void>;
  onDailyRateChange: (id: string, dailyRate: string) => Promise<void>;
  onResidenceChange: (id: string, residence: string) => Promise<void>;
  onMobilityChange: (id: string, mobility: string) => Promise<void>;
  onPhoneChange: (id: string, phone: string) => Promise<void>;
  onEmailChange: (id: string, email: string) => Promise<void>;
  onView: (prospect: BoondmanagerProspect) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCommentsChange: (id: string, comments: string) => Promise<void>;
}

export function ClientNeedsTable({
  prospects,
  salesReps,
  onStatusChange,
  onAssigneeChange,
  onSelectedNeedChange,
  onAvailabilityChange,
  onDailyRateChange,
  onResidenceChange,
  onMobilityChange,
  onPhoneChange,
  onEmailChange,
  onView,
  onDelete,
  onCommentsChange,
}: ClientNeedsTableProps) {
  const statusOptions: BoondmanagerProspect['status'][] = ['À traiter', 'Traité'];
  const [sort, setSort] = useState<SortState>({ field: null, direction: null });
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('');
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<BoondmanagerProspect | null>(null);
  const [selectedProspectForComments, setSelectedProspectForComments] = useState<BoondmanagerProspect | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; prospectId: string; prospectTitle: string }>({
    isOpen: false,
    prospectId: '',
    prospectTitle: ''
  });

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
        const storageKey = `selectedSalesRepClientNeeds_${userEmail}`;
        
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
          const storageKey = `selectedSalesRepClientNeeds_${session.user.email}`;
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

  const filteredProspects = useMemo(() => {
    let filtered = prospects;
    
    // Filtrage par commercial
    if (selectedSalesRep) {
      filtered = prospects.filter(prospect => prospect.assignedTo === selectedSalesRep);
    }
    
    // Filtrage par recherche textuelle
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(prospect => 
        prospect.selectedNeedTitle.toLowerCase().includes(searchLower) ||
        prospect.residence.toLowerCase().includes(searchLower) ||
        prospect.email.toLowerCase().includes(searchLower) ||
        prospect.phone.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [prospects, selectedSalesRep, searchTerm]);

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

  const sortedProspects = useMemo(() => {
    if (!sort.field || !sort.direction) return filteredProspects;

    return [...filteredProspects].sort((a, b) => {
      const direction = sort.direction === 'asc' ? 1 : -1;

      if (sort.field === 'besoin') {
        const valA = (a.selectedNeedTitle || '').toLowerCase();
        const valB = (b.selectedNeedTitle || '').toLowerCase();
        return valA.localeCompare(valB) * direction;
      }
      
      switch (sort.field) {
        case 'dailyRate':
          const rateA = a.dailyRate || 0;
          const rateB = b.dailyRate || 0;
          return (rateA - rateB) * direction;

        default:
          const valA = (a[sort.field] || '').toLowerCase();
          const valB = (b[sort.field] || '').toLowerCase();
          return valA.localeCompare(valB) * direction;
      }
    });
  }, [filteredProspects, sort]);

  const handleEdit = (prospect: BoondmanagerProspect, field: EditingField['field']) => {
    let value = '';
    switch (field) {
      case 'besoin':
        value = prospect.selectedNeedTitle || '';
        break;
      case 'dailyRate':
        value = prospect.dailyRate?.toString() || '';
        break;
      default:
        value = prospect[field];
    }
    setEditingField({ id: prospect.id, value, field });
  };

  const handleSave = async () => {
    if (editingField) {
      try {
        const { id, value, field } = editingField;
        if (!id) {
          console.error('No prospect ID provided for update');
          return;
        }

        switch (editingField.field) {
          case 'besoin':
            await onSelectedNeedChange(id, value);
            break;
          case 'availability':
            await onAvailabilityChange(id, value);
            break;
          case 'dailyRate':
            await onDailyRateChange(id, value);
            break;
          case 'residence':
            await onResidenceChange(id, value);
            break;
          case 'mobility':
            await onMobilityChange(id, value);
            break;
          case 'phone':
            await onPhoneChange(id, value);
            break;
          case 'email':
            await onEmailChange(id, value);
            break;
        }
      } catch (error) {
        console.error(`Failed to update ${editingField.field}:`, error);
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

  const handleViewProspect = async (prospect: BoondmanagerProspect) => {
    await onView(prospect);
    setSelectedProspect(prospect);
  };
  const handleDeleteClick = (prospect: BoondmanagerProspect) => {
    setDeleteConfirm({
      isOpen: true,
      prospectId: prospect.id,
      prospectTitle: `${prospect.selectedNeedTitle || 'Profil pour besoin client'}`
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.prospectId) {
      await onDelete(deleteConfirm.prospectId);
      setDeleteConfirm({ isOpen: false, prospectId: '', prospectTitle: '' });
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
    <div className="space-y-4 w-full">
      <ProspectContentModal
        isOpen={!!selectedProspect}
        onClose={() => setSelectedProspect(null)}
        content={selectedProspect?.textContent || ''}
        fileName={selectedProspect?.fileName || ''}
        fileUrl={selectedProspect?.fileUrl || ''}
        fileContent={selectedProspect?.fileContent}
      />
      
      <ClientNeedCommentsModal
        isOpen={!!selectedProspectForComments}
        onClose={() => setSelectedProspectForComments(null)}
        clientNeed={selectedProspectForComments || { id: '', selectedNeedTitle: '', comments: '' }}
        onSave={onCommentsChange}
      />
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex flex-col space-y-4">
          {/* Première ligne : Filtres */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="sales-rep-filter-client-needs" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filtrer par commercial :
              </label>
              <select
                id="sales-rep-filter-client-needs"
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
              <label htmlFor="search-filter-client-needs" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Rechercher :
              </label>
              <input
                id="search-filter-client-needs"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Besoin, résidence, email, téléphone..."
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
      
      <div className="w-full overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div 
          ref={tableRef}
          className="w-full overflow-x-auto max-h-[70vh]"
          style={{ 
            willChange: isScrolling ? 'transform' : 'auto',
            contain: 'content'
          }}
        >
          <table className="w-full border-collapse">
            <thead className="bg-white dark:bg-gray-800 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
              <tr className="text-left">
                <th className="p-2 sm:p-4 w-16 bg-white dark:bg-gray-800" />
                <th 
                  className="p-2 sm:p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none min-w-[120px] bg-white dark:bg-gray-800"
                  onClick={() => handleSort('besoin')}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm">Besoin</span>
                    {getSortIcon('besoin')}
                  </div>
                </th>
                <th 
                  className="p-2 sm:p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none min-w-[100px] bg-white dark:bg-gray-800"
                  onClick={() => handleSort('availability')}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm">Disponibilité</span>
                    {getSortIcon('availability')}
                  </div>
                </th>
                <th 
                  className="p-2 sm:p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none min-w-[90px] bg-white dark:bg-gray-800"
                  onClick={() => handleSort('dailyRate')}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm">TJM/Salaire</span>
                    {getSortIcon('dailyRate')}
                  </div>
                </th>
                <th 
                  className="p-2 sm:p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none min-w-[80px] bg-white dark:bg-gray-800"
                  onClick={() => handleSort('residence')}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm">Résidence</span>
                    {getSortIcon('residence')}
                  </div>
                </th>
                <th 
                  className="p-2 sm:p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none min-w-[80px] bg-white dark:bg-gray-800"
                  onClick={() => handleSort('mobility')}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm">Mobilité</span>
                    {getSortIcon('mobility')}
                  </div>
                </th>
                <th className="p-2 sm:p-4 font-medium text-gray-600 dark:text-gray-200 min-w-[180px] bg-white dark:bg-gray-800">
                  <span className="text-xs sm:text-sm">Contact</span>
                </th>
                <th className="p-2 sm:p-4 font-medium text-gray-600 dark:text-gray-200 min-w-[90px] bg-white dark:bg-gray-800">
                  <span className="text-xs sm:text-sm">Statut</span>
                </th>
                <th className="p-2 sm:p-4 font-medium text-gray-600 dark:text-gray-200 min-w-[80px] bg-white dark:bg-gray-800">
                  <span className="text-xs sm:text-sm">Commercial</span>
                </th>
                <th className="p-2 sm:p-4 font-medium text-gray-600 dark:text-gray-200 min-w-[80px] bg-white dark:bg-gray-800">
                  <span className="text-xs sm:text-sm">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProspects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Aucun profil trouvé pour les besoins clients
                  </td>
                </tr>
              ) : (
                sortedProspects.map((prospect) => (
                  <tr 
                    key={prospect.id} 
                    className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 group ${
                      prospect.status === 'Traité' ? 'bg-gray-200 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <td className="p-2 sm:p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        prospect.isRead 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}>
                        {prospect.isRead ? 'Lu' : 'NEW'}
                      </span>
                    </td>
                    
                    {/* Besoin */}
                    <td className="p-2 sm:p-4 text-gray-900 dark:text-gray-100">
                      {editingField?.id === prospect.id && editingField.field === 'besoin' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingField.value}
                            onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                            onKeyDown={handleKeyPress}
                            className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-xs sm:text-sm"
                            placeholder="Besoin client"
                            autoFocus
                          />
                          <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 flex-shrink-0" title="Sauvegarder">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0" title="Annuler">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div onClick={() => handleEdit(prospect, 'besoin')} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm break-words" title="Cliquer pour modifier">
                          {prospect.selectedNeedTitle || 'Non spécifié'}
                        </div>
                      )}
                    </td>

                    {/* Disponibilité */}
                    <td className="p-2 sm:p-4 text-gray-900 dark:text-gray-100">
                      {editingField?.id === prospect.id && editingField.field === 'availability' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingField.value}
                            onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                            onKeyDown={handleKeyPress}
                            className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-xs sm:text-sm"
                            autoFocus
                          />
                          <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 flex-shrink-0" title="Sauvegarder">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0" title="Annuler">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div onClick={() => handleEdit(prospect, 'availability')} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm break-words" title="Cliquer pour modifier">
                          {prospect.availability}
                        </div>
                      )}
                    </td>

                    {/* TJM / Salaire */}
                    <td className="p-2 sm:p-4 text-gray-900 dark:text-gray-100">
                      {editingField?.id === prospect.id && editingField.field === 'dailyRate' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editingField.value}
                            onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                            onKeyDown={handleKeyPress}
                            className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-xs sm:text-sm"
                            min="0"
                            step="1"
                            autoFocus
                          />
                          <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 flex-shrink-0" title="Sauvegarder">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0" title="Annuler">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div onClick={() => handleEdit(prospect, 'dailyRate')} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm" title="Cliquer pour modifier">
                          {typeof prospect.dailyRate === 'number' ? 
                            `${prospect.dailyRate}€` 
                            : ''} 
                          {typeof prospect.salaryExpectations === 'number' ? 
                            `${prospect.salaryExpectations ? (prospect.dailyRate ? ' / ' : '') + prospect.salaryExpectations + 'K€' : ''}`
                            : prospect.dailyRate ? '' : '-'}
                        </div>
                      )}
                    </td>

                    {/* Résidence */}
                    <td className="p-2 sm:p-4 text-gray-900 dark:text-gray-100">
                      {editingField?.id === prospect.id && editingField.field === 'residence' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingField.value}
                            onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                            onKeyDown={handleKeyPress}
                            className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-xs sm:text-sm"
                            autoFocus
                          />
                          <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 flex-shrink-0" title="Sauvegarder">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0" title="Annuler">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => handleEdit(prospect, 'residence')} 
                          className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm break-words" 
                          title="Cliquer pour modifier"
                        >
                          {prospect.residence || '-'}
                        </div>
                      )}
                    </td>

                    {/* Mobilité */}
                    <td className="p-2 sm:p-4 text-gray-900 dark:text-gray-100">
                      {editingField?.id === prospect.id && editingField.field === 'mobility' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingField.value}
                            onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                            onKeyDown={handleKeyPress}
                            className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-xs sm:text-sm"
                            autoFocus
                          />
                          <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 flex-shrink-0" title="Sauvegarder">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0" title="Annuler">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => handleEdit(prospect, 'mobility')} 
                          className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm break-words" 
                          title="Cliquer pour modifier"
                        >
                          {prospect.mobility || '-'}
                        </div>
                      )}
                    </td>

                    {/* Contact (Email + Téléphone) */}
                    <td className="p-2 sm:p-4 text-gray-900 dark:text-gray-100">
                      <div className="space-y-1">
                        {editingField?.id === prospect.id && editingField.field === 'email' ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="email"
                              value={editingField.value}
                              onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                              onKeyDown={handleKeyPress}
                              className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-xs sm:text-sm"
                              autoFocus
                            />
                            <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 flex-shrink-0" title="Sauvegarder">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0" title="Annuler">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => handleEdit(prospect, 'email')} 
                            className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm break-words flex items-center" 
                            title="Cliquer pour modifier l'email"
                          >
                            {prospect.email || '-'}
                          </div>
                        )}
                        
                        {editingField?.id === prospect.id && editingField.field === 'phone' ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="tel"
                              value={editingField.value}
                              onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                              onKeyDown={handleKeyPress}
                              className="w-full px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-xs sm:text-sm"
                              autoFocus
                            />
                            <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 flex-shrink-0" title="Sauvegarder">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0" title="Annuler">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => handleEdit(prospect, 'phone')} 
                            className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm break-words flex items-center" 
                            title="Cliquer pour modifier le téléphone"
                          >
                            {prospect.phone || '-'}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="p-2 sm:p-4">
                      <select
                        value={prospect.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as 'À traiter' | 'Traité';
                          onStatusChange(prospect.id, newStatus);
                        }}
                        className="w-full p-1 sm:p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Commercial */}
                    <td className="p-2 sm:p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {salesRepsMap.get(prospect.assignedTo) || '---'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-2 sm:p-4">
                      <div className="flex space-x-1 sm:space-x-2">
                        <button
                          onClick={() => onFavoriteToggle(prospect.id, !prospect.isFavorite)}
                          className={`p-1 transition-colors ${
                            prospect.isFavorite
                              ? 'text-yellow-500 hover:text-yellow-600'
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                          title={prospect.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                        >
                          <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${prospect.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => {
                            // Marquer comme lu sans ouvrir la modal
                            onView(prospect);
                            // Ouvrir directement le CV dans un nouvel onglet si disponible
                            if (prospect.fileUrl) {
                              window.open(prospect.fileUrl, '_blank');
                            }
                          }}
                          className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          title="Voir le profil"
                        >
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedProspectForComments(prospect)}
                          title="Commentaires"
                          className="relative p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                          {prospect.comments && prospect.comments.trim() && (
                            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                              !
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(prospect)}
                          title="Supprimer"
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, prospectId: '', prospectTitle: '' })}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer ce profil ?\n\n"${deleteConfirm.prospectTitle}"\n\nCette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isDestructive={true}
      />
    </div>
  );
}