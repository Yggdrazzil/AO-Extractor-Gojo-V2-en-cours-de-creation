import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ReferenceMarketplaceForm } from './ReferenceMarketplaceForm';
import { ReferenceMarketplaceTable } from './ReferenceMarketplaceTable';
import { ReferenceCommentsModal } from './ReferenceCommentsModal';
import type { ReferenceMarketplace, SalesRep } from '../types';
import {
  fetchReferenceMarketplace,
  addReferenceMarketplace,
  updateReferenceMarketplace,
  deleteReferenceMarketplace
} from '../services/referenceMarketplace';

interface ReferenceMarketplaceProps {
  salesReps: SalesRep[];
}

export function ReferenceMarketplaceComponent({ salesReps }: ReferenceMarketplaceProps) {
  const [references, setReferences] = useState<ReferenceMarketplace[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReference, setSelectedReference] = useState<ReferenceMarketplace | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSalesRep, setSelectedSalesRep] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReferences();
  }, []);

  const loadReferences = async () => {
    try {
      setIsLoading(true);
      const data = await fetchReferenceMarketplace();
      setReferences(data);
    } catch (error) {
      console.error('Error loading references:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReference = async (data: any) => {
    try {
      const newReference = await addReferenceMarketplace(data);
      setReferences([newReference, ...references]);
    } catch (error) {
      console.error('Error adding reference:', error);
      throw error;
    }
  };

  const handleUpdateReference = async (id: string, updates: Partial<ReferenceMarketplace>) => {
    try {
      const updatedReference = await updateReferenceMarketplace(id, updates);
      setReferences(references.map(ref => ref.id === id ? updatedReference : ref));
    } catch (error) {
      console.error('Error updating reference:', error);
    }
  };

  const handleDeleteReference = async (id: string) => {
    try {
      await deleteReferenceMarketplace(id);
      setReferences(references.filter(ref => ref.id !== id));
    } catch (error) {
      console.error('Error deleting reference:', error);
    }
  };

  const handleOpenComments = (reference: ReferenceMarketplace) => {
    setSelectedReference(reference);
    setIsCommentsModalOpen(true);
  };

  const handleSaveComments = async (referenceId: string, comments: string) => {
    await handleUpdateReference(referenceId, { comments });
  };

  const filteredReferences = references.filter(ref => {
    const matchesSalesRep = !selectedSalesRep || ref.sales_rep_id === selectedSalesRep;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      ref.client?.toLowerCase().includes(searchLower) ||
      ref.tech_name?.toLowerCase().includes(searchLower) ||
      ref.operational_contact?.toLowerCase().includes(searchLower) ||
      ref.email?.toLowerCase().includes(searchLower) ||
      ref.phone?.toLowerCase().includes(searchLower);

    return matchesSalesRep && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Marketplace des Références
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Filtrer par commercial :
          </label>
          <select
            value={selectedSalesRep}
            onChange={(e) => setSelectedSalesRep(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Rechercher :
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Besoin, résidence, email, téléphone..."
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1651EE]"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ReferenceMarketplaceTable
            references={filteredReferences}
            salesReps={salesReps}
            onUpdate={handleUpdateReference}
            onDelete={handleDeleteReference}
            onOpenComments={handleOpenComments}
          />
        </div>
      )}

      <button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#1651EE] text-white rounded-full shadow-lg hover:bg-[#1651EE]/90 transition-all hover:scale-110 flex items-center justify-center"
        title="Ajouter une référence"
      >
        <Plus className="w-6 h-6" />
      </button>

      <ReferenceMarketplaceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddReference}
      />

      {selectedReference && (
        <ReferenceCommentsModal
          isOpen={isCommentsModalOpen}
          onClose={() => {
            setIsCommentsModalOpen(false);
            setSelectedReference(null);
          }}
          reference={selectedReference}
          onSave={handleSaveComments}
        />
      )}
    </div>
  );
}
