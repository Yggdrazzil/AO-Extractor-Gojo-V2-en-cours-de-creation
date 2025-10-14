import React, { useState } from 'react';
import { Eye, Trash2, MessageSquare, FileText } from 'lucide-react';
import type { ReferenceMarketplace, SalesRep } from '../types';
import { supabase } from '../lib/supabase';

interface ReferenceMarketplaceTableProps {
  references: ReferenceMarketplace[];
  salesReps: SalesRep[];
  onUpdate: (id: string, updates: Partial<ReferenceMarketplace>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenComments: (reference: ReferenceMarketplace) => void;
  onOpenPdf: (reference: ReferenceMarketplace) => void;
}

export function ReferenceMarketplaceTable({
  references,
  salesReps,
  onUpdate,
  onDelete,
  onOpenComments,
  onOpenPdf
}: ReferenceMarketplaceTableProps) {
  const [editingField, setEditingField] = useState<{
    id: string;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState('');

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
              Commercial
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              PDF
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {references.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                Aucune référence pour le moment
              </td>
            </tr>
          ) : (
            references.map((reference) => (
              <tr
                key={reference.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
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
                <td className="px-4 py-3 text-sm">
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
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {reference.pdf_url ? (
                    <button
                      onClick={() => onOpenPdf(reference)}
                      className="inline-flex items-center gap-1 text-[#1651EE] hover:text-[#1651EE]/80"
                      title="Voir le PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onOpenComments(reference)}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-[#1651EE] dark:hover:text-[#1651EE] hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Commentaires"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer cette référence ?')) {
                          onDelete(reference.id);
                        }
                      }}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
