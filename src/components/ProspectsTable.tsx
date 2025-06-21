import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Prospect, SalesRep } from '../types';
import { Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Check, X, Download } from 'lucide-react';
import { ProspectContentModal } from './ProspectContentModal';

interface EditingField {
  id: string;
  value: string;
  field: 'targetAccount' | 'availability' | 'dailyRate' | 'residence' | 'mobility' | 'phone' | 'email';
}

type SortField = 'targetAccount' | 'availability' | 'dailyRate' | 'residence' | 'mobility' | 'phone' | 'email';
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

interface ProspectsTableProps {
  prospects: Prospect[];
  salesReps: SalesRep[];
  onStatusChange: (id: string, status: Prospect['status']) => Promise<void>;
  onAssigneeChange: (id: string, assignedTo: string) => Promise<void>;
  onTargetAccountChange: (id: string, targetAccount: string) => Promise<void>;
  onAvailabilityChange: (id: string, availability: string) => Promise<void>;
  onDailyRateChange: (id: string, dailyRate: string) => Promise<void>;
  onResidenceChange: (id: string, residence: string) => Promise<void>;
  onMobilityChange: (id: string, mobility: string) => Promise<void>;
  onPhoneChange: (id: string, phone: string) => Promise<void>;
  onEmailChange: (id: string, email: string) => Promise<void>;
  onView: (prospect: Prospect) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ProspectsTable({
  prospects,
  salesReps,
  onStatusChange,
  onAssigneeChange,
  onTargetAccountChange,
  onAvailabilityChange,
  onDailyRateChange,
  onResidenceChange,
  onMobilityChange,
  onPhoneChange,
  onEmailChange,
  onView,
  onDelete,
}: ProspectsTableProps) {
  const statusOptions: Prospect['status'][] = ['À traiter', 'Traité'];
  const [sort, setSort] = useState<SortState>({ field: null, direction: null });
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('');
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

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
        const storageKey = `selectedSalesRepProspects_${userEmail}`;
        
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
          const storageKey = `selectedSalesRepProspects_${session.user.email}`;
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
    if (selectedSalesRep) {
      filtered = prospects.filter(prospect => prospect.assignedTo === selectedSalesRep);
    }
    return filtered;
  }, [prospects, selectedSalesRep]);

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

  const handleEdit = (prospect: Prospect, field: EditingField['field']) => {
    let value = '';
    switch (field) {
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
          case 'targetAccount':
            await onTargetAccountChange(id, value);
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

  const handleViewProspect = async (prospect: Prospect) => {
    await onView(prospect);
    setSelectedProspect(prospect);
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
      <ProspectContentModal
        isOpen={!!selectedProspect}
        onClose={() => setSelectedProspect(null)}
        content={selectedProspect?.textContent || ''}
        fileName={selectedProspect?.fileName || ''}
        fileUrl={selectedProspect?.fileUrl || ''}
        fileContent={selectedProspect?.fileContent}
      />
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2">
          <label htmlFor="sales-rep-filter-prospects" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrer par commercial :
          </label>
          <select
            id="sales-rep-filter-prospects"
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
                onClick={() => handleSort('targetAccount')}
              >
                <div className="flex items-center gap-2">
                  Compte Ciblé
                  {getSortIcon('targetAccount')}
                </div>
              </th>
              <th 
                className="p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none"
                onClick={() => handleSort('availability')}
              >
                <div className="flex items-center gap-2">
                  Disponibilité
                  {getSortIcon('availability')}
                </div>
              </th>
              <th 
                className="p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none"
                onClick={() => handleSort('dailyRate')}
              >
                <div className="flex items-center gap-2">
                  TJM/Salaire
                  {getSortIcon('dailyRate')}
                </div>
              </th>
              <th 
                className="p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none"
                onClick={() => handleSort('residence')}
              >
                <div className="flex items-center gap-2">
                  Résidence
                  {getSortIcon('residence')}
                </div>
              </th>
              <th 
                className="p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none"
                onClick={() => handleSort('mobility')}
              >
                <div className="flex items-center gap-2">
                  Mobilité
                  {getSortIcon('mobility')}
                </div>
              </th>
              <th 
                className="p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none"
                onClick={() => handleSort('phone')}
              >
                <div className="flex items-center gap-2">
                  Téléphone
                  {getSortIcon('phone')}
                </div>
              </th>
              <th 
                className="p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-2">
                  Email
                  {getSortIcon('email')}
                </div>
              </th>
              <th className="p-4 font-medium text-gray-600 dark:text-gray-200">Statut</th>
              <th className="p-4 font-medium text-gray-600 dark:text-gray-200">Commercial</th>
              <th className="p-4 font-medium text-gray-600 dark:text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedProspects.map((prospect) => (
              <tr 
                key={prospect.id} 
                className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 group ${
                  prospect.status === 'Traité' ? 'bg-gray-200 dark:bg-gray-900' : 'dark:bg-gray-600'
                }`}
              >
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    prospect.isRead 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  }`}>
                    {prospect.isRead ? 'Lu' : 'NEW'}
                  </span>
                </td>
                
                {/* Compte Ciblé */}
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === prospect.id && editingField.field === 'targetAccount' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        placeholder="Nom du compte ciblé"
                        autoFocus
                      />
                      <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400" title="Sauvegarder">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400" title="Annuler">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => handleEdit(prospect, 'targetAccount')} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" title="Cliquer pour modifier">
                      {prospect.targetAccount || 'Non spécifié'}
                    </div>
                  )}
                </td>

                {/* Disponibilité */}
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === prospect.id && editingField.field === 'availability' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        autoFocus
                      />
                      <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400" title="Sauvegarder">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400" title="Annuler">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => handleEdit(prospect, 'availability')} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" title="Cliquer pour modifier">
                      {prospect.availability || 'Non spécifié'}
                    </div>
                  )}
                </td>

                {/* TJM */}
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === prospect.id && editingField.field === 'dailyRate' ? (
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
                      <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400" title="Sauvegarder">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400" title="Annuler">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => handleEdit(prospect, 'dailyRate')} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" title="Cliquer pour modifier">
                      {typeof prospect.dailyRate === 'number' ? `${prospect.dailyRate}€` : '-'}
                    </div>
                  )}
                </td>

                {/* Résidence */}
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === prospect.id && editingField.field === 'residence' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        autoFocus
                      />
                      <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400" title="Sauvegarder">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400" title="Annuler">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => handleEdit(prospect, 'residence')} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" title="Cliquer pour modifier">
                      {prospect.residence || 'Non spécifié'}
                    </div>
                  )}
                </td>

                {/* Mobilité */}
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === prospect.id && editingField.field === 'mobility' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        autoFocus
                      />
                      <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400" title="Sauvegarder">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400" title="Annuler">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => handleEdit(prospect, 'mobility')} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" title="Cliquer pour modifier">
                      {prospect.mobility || 'Non spécifié'}
                    </div>
                  )}
                </td>

                {/* Téléphone */}
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === prospect.id && editingField.field === 'phone' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="tel"
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        autoFocus
                      />
                      <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400" title="Sauvegarder">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400" title="Annuler">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => handleEdit(prospect, 'phone')} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" title="Cliquer pour modifier">
                      {prospect.phone || 'Non spécifié'}
                    </div>
                  )}
                </td>

                {/* Email */}
                <td className="p-4 text-gray-900 dark:text-gray-100">
                  {editingField?.id === prospect.id && editingField.field === 'email' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={editingField.value}
                        onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-2 py-1 border border-blue-500 dark:border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                        autoFocus
                      />
                      <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400" title="Sauvegarder">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400" title="Annuler">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => handleEdit(prospect, 'email')} className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" title="Cliquer pour modifier">
                      {prospect.email || 'Non spécifié'}
                    </div>
                  )}
                </td>

                {/* Statut */}
                <td className="p-4">
                  <select
                    value={prospect.status}
                    onChange={(e) => onStatusChange(prospect.id, e.target.value as Prospect['status'])}
                    className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Commercial */}
                <td className="p-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {salesRepsMap.get(prospect.assignedTo) || '---'}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-4">
                  <div className="flex space-x-2">
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
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(prospect.id)}
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