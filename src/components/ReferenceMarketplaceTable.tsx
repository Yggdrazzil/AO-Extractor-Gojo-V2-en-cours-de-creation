import React, { useState } from 'react';
import { Eye, Trash2, MessageSquare, FileText } from 'lucide-react';
import type { ReferenceMarketplace, SalesRep } from '../types';
import { supabase } from '../lib/supabase';
import { ConfirmDialog } from './common/ConfirmDialog';

interface ReferenceMarketplaceTableProps {
  references: ReferenceMarketplace[];
  salesReps: SalesRep[];
  onUpdate: (id: string, updates: Partial<ReferenceMarketplace>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenComments: (reference: ReferenceMarketplace) => void;
}

export function ReferenceMarketplaceTable({
  references,
  salesReps,
  onUpdate,
  onDelete,
  onOpenComments
}: ReferenceMarketplaceTableProps) {
  const [editingField, setEditingField] = useState<{
    id: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; referenceId: string; referenceTitle: string }>({
    isOpen: false,
    referenceId: '',
    referenceTitle: ''
  });

  const handleEdit = (id: string, field: string, currentValue: string) => {
    setEditingField({ id, field });
    setEditValue(currentValue || '');
  };

  const handleSave = async (id: string, field: string) => {
    if (editValue !== '') {
      await onUpdate(id, { [field]: editValue });
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleSalesRepChange = async (id: string, salesRepId: string) => {
    await onUpdate(id, { sales_rep_id: salesRepId || null });
  };

  const handleKeyPress = (e: React.KeyboardEvent, id: string, field: string) => {
    if (e.key === 'Enter') {
      handleSave(id, field);
    } else if (e.key === 'Escape') {
      setEditingField(null);
      setEditValue('');
    }
  };

  const handleDeleteClick = (reference: ReferenceMarketplace) => {
    setDeleteConfirm({
      isOpen: true,
      referenceId: reference.id,
      referenceTitle: `${reference.tech_name} - ${reference.client}`
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.referenceId) {
      await onDelete(deleteConfirm.referenceId);
      setDeleteConfirm({ isOpen: false, referenceId: '', referenceTitle: '' });
    }
  };

  const renderEditableField = (
    reference: ReferenceMarketplace,
    field: keyof ReferenceMarketplace,
    value: string
  ) => {
    const isEditing = editingField?.id === reference.id && editingField?.field === field;

    if (isEditing) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleSave(reference.id, field)}
          onKeyDown={(e) => handleKeyPress(e, reference.id, field)}
          className="w-full px-2 py-1 border border-[#1651EE] rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          autoFocus
        />
      );
    }

    return (
      <div
        onClick={() => handleEdit(reference.id, field, value)}
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded min-h-[32px] flex items-center"
        title="Cliquer pour modifier"
      >
        {value || '-'}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Client
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Opérationnel à Contacter
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Téléphone
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Mail
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Nom du Tech
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Date d'ajout
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Commercial
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              CV Tech
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {references.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Aucune référence pour le moment
              </td>
            </tr>
          ) : (
            references.map((reference) => {
              const rowBgClass = reference.status === 'Traité'
                ? 'bg-gray-200 dark:bg-gray-900'
                : 'bg-white dark:bg-gray-800';
              const borderClass = reference.status === 'Traité'
                ? 'border-gray-300 dark:border-gray-800'
                : 'border-gray-200 dark:border-gray-700';

              return (
              <tr
                key={reference.id}
                className={`border-t hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${rowBgClass} ${borderClass}`}
              >
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {renderEditableField(reference, 'client', reference.client)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {renderEditableField(reference, 'operational_contact', reference.operational_contact)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {renderEditableField(reference, 'phone', reference.phone)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {renderEditableField(reference, 'email', reference.email)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {renderEditableField(reference, 'tech_name', reference.tech_name)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(reference.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3 text-sm">
                  {reference.sales_rep_id ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {reference.sales_rep?.code || '-'}
                    </span>
                  ) : (
                    <select
                      value={reference.sales_rep_id || ''}
                      onChange={(e) => handleSalesRepChange(reference.id, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      <option value="">Non assigné</option>
                      {salesReps.map((rep) => (
                        <option key={rep.id} value={rep.id}>
                          {rep.name} ({rep.code})
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <select
                    value={reference.status || 'A traiter'}
                    onChange={(e) => onUpdate(reference.id, { status: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="A traiter">A traiter</option>
                    <option value="Traité">Traité</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {reference.pdf_url ? (
                    <a
                      href={reference.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#1651EE] hover:text-[#1651EE]/80 transition-colors"
                      title="Voir le CV"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="group relative">
                      <button
                        onClick={() => onOpenComments(reference)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-[#1651EE] dark:hover:text-[#1651EE] hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Commentaires"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {reference.comments && reference.comments.trim() && (
                          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            !
                          </span>
                        )}
                      </button>
                      {reference.comments && reference.comments.trim() && (
                        <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-[9999] pointer-events-none">
                          <div className="relative">
                            <div className="bg-[#4a4f57]/95 backdrop-blur-md text-white text-sm rounded-lg shadow-xl border border-gray-600/50 p-3 max-w-sm w-max max-h-60 overflow-y-auto whitespace-pre-wrap break-words">
                              {reference.comments}
                            </div>
                            <div className="absolute -bottom-1 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[#4a4f57]/95"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteClick(reference)}
                      className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })
          )}
        </tbody>
      </table>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, referenceId: '', referenceTitle: '' })}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer cette référence ?\n\n"${deleteConfirm.referenceTitle}"\n\nCette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isDestructive={true}
      />
    </div>
  );
}
