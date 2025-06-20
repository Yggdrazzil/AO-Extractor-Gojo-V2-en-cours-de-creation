import React from 'react';
import { X, Download } from 'lucide-react';

interface ProspectContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  fileName: string;
  fileUrl: string;
}

export function ProspectContentModal({ isOpen, onClose, content, fileName, fileUrl }: ProspectContentModalProps) {
  if (!isOpen) return null;

  const formatContent = (text: string) => {
    if (!text) return <p className="text-gray-500 dark:text-gray-400">Aucun contenu textuel disponible</p>;

    return text.split('\n').map((line, index) => (
      <p key={index} className="mb-2 text-gray-900 dark:text-gray-100">
        {line}
      </p>
    ));
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
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden text-gray-900 dark:text-gray-100">
        <div className="p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Profil Candidat</h2>
            {fileName && (
              <p className="text-sm text-gray-600 dark:text-gray-400">Fichier: {fileName}</p>
            )}
          </div>
          {fileUrl && (
            <a
              href={fileUrl}
              download={fileName}
              className="mr-2 p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
              title="Télécharger le CV"
            >
              <Download className="w-5 h-5" />
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="prose dark:prose-invert max-w-none">
            {formatContent(content)}
          </div>
        </div>
      </div>
    </div>
  );
}