import React, { useState } from 'react';
import { X, MessageSquare, Save } from 'lucide-react';

interface RFPCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfp: {
    id: string;
    client: string;
    mission: string;
    comments?: string;
  };
  onSave: (rfpId: string, comments: string) => Promise<void>;
}

export function RFPCommentsModal({ isOpen, onClose, rfp, onSave }: RFPCommentsModalProps) {
  const [comments, setComments] = useState(rfp.comments || '');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setComments(rfp.comments || '');
    }
  }, [isOpen, rfp.comments]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(rfp.id, comments);
      onClose();
    } catch (error) {
      console.error('Error saving comments:', error);
      alert('Erreur lors de la sauvegarde des commentaires');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClickOutside}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Commentaires
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              {rfp.client}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {rfp.mission}
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Commentaires
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !(e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSave();
                } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  // Laisser le comportement par défaut pour ajouter une nouvelle ligne
                  // Ne pas appeler preventDefault() pour permettre le retour à la ligne
                }
              }}
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Ajoutez vos commentaires pour cet AO... (Entrée pour sauvegarder, Ctrl+Entrée pour nouvelle ligne)"
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isSaving}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}