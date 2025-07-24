import React, { useState } from 'react';
import { X, MessageSquare, Save } from 'lucide-react';

interface ProspectCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: {
    id: string;
    targetAccount: string;
    comments?: string;
  };
  onSave: (prospectId: string, comments: string) => Promise<void>;
}

export function ProspectCommentsModal({ isOpen, onClose, prospect, onSave }: ProspectCommentsModalProps) {
  const [comments, setComments] = useState(prospect.comments || '');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setComments(prospect.comments || '');
    }
  }, [isOpen, prospect.comments]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log('💾 Saving comment for Prospect:', prospect.id, 'Content:', comments);
      await onSave(prospect.id, comments);
      console.log('✅ Prospect comment saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving prospect comments:', error);
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
              Prospect : {prospect.targetAccount}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Prise de références
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="prospect-comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Commentaires
            </label>
            <textarea
              id="prospect-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !(e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSave();
                } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  const textarea = e.target as HTMLTextAreaElement;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const value = textarea.value;
                  const newValue = value.substring(0, start) + '\n' + value.substring(end);
                  setComments(newValue);
                  setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + 1;
                  }, 0);
                }
              }}
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Ajoutez vos commentaires pour ce prospect... (Entrée pour sauvegarder, Ctrl+Entrée pour nouvelle ligne)"
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