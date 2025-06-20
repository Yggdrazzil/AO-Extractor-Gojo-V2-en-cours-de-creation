import React from 'react';
import { X, Download } from 'lucide-react';

interface ProspectContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  fileName: string;
  fileUrl: string;
  fileContent?: string;
}

export function ProspectContentModal({ isOpen, onClose, content, fileName, fileUrl, fileContent }: ProspectContentModalProps) {
  if (!isOpen) return null;


  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderContent = () => {
    // Si on a un fichier CV, on affiche un aperçu ou un lien de téléchargement
    if (fileName && fileUrl) {
      const isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);
      const isPDF = fileName.toLowerCase().endsWith('.pdf');
      
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  CV du candidat
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {fileName}
                </p>
              </div>
              <a
                href={fileUrl}
                download={fileName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger</span>
              </a>
            </div>
          </div>
          
          {isPDF && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Aperçu du CV (PDF) :
              </p>
              <iframe
                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-96 border border-gray-300 dark:border-gray-600 rounded"
                title="Aperçu du CV"
              />
            </div>
          )}
          
          {fileContent && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                Contenu extrait du CV :
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans">{fileContent}</pre>
              </div>
            </div>
          )}
          
          {content && content.trim() && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                Informations textuelles complémentaires :
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {content.split('\n').map((line, index) => (
                  <p key={index} className="mb-2">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Si on n'a que du contenu textuel
    if (content && content.trim()) {
      return (
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Aucun CV joint - Seules les informations textuelles sont disponibles
            </p>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            {content.split('\n').map((line, index) => (
              <p key={index} className="mb-2 text-gray-900 dark:text-gray-100">
                {line}
              </p>
            ))}
          </div>
        </div>
      );
    }
    
    // Aucun contenu disponible
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📄</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          Aucun contenu disponible pour ce profil
        </p>
      </div>
    );
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}