import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ReferenceMarketplaceForm } from './ReferenceMarketplaceForm';
import { ReferenceMarketplaceTable } from './ReferenceMarketplaceTable';
import { ReferenceCommentsModal } from './ReferenceCommentsModal';
import { ReferencePdfModal } from './ReferencePdfModal';
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
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleOpenPdf = (reference: ReferenceMarketplace) => {
    setSelectedReference(reference);
    setIsPdfModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Marketplace des Références
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {references.length} référence{references.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1651EE]"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ReferenceMarketplaceTable
            references={references}
            salesReps={salesReps}
            onUpdate={handleUpdateReference}
            onDelete={handleDeleteReference}
            onOpenComments={handleOpenComments}
            onOpenPdf={handleOpenPdf}
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

      <ReferenceCommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => {
          setIsCommentsModalOpen(false);
          setSelectedReference(null);
        }}
        reference={selectedReference}
      />

      <ReferencePdfModal
        isOpen={isPdfModalOpen}
        onClose={() => {
          setIsPdfModalOpen(false);
          setSelectedReference(null);
        }}
        reference={selectedReference}
      />
    </div>
  );
}
