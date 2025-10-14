import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import type { ReferenceMarketplace } from '../types';

interface ReferencePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  reference: ReferenceMarketplace | null;
}

export function ReferencePdfModal({ isOpen, onClose, reference }: ReferencePdfModalProps) {
  if (!isOpen || !reference || !reference.pdf_url) return null;

  const handleDownload = () => {
    if (reference.pdf_url) {
      const link = document.createElement('a');
      link.href = reference.pdf_url;
      link.download = reference.pdf_name || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (reference.pdf_url) {
      window.open(reference.pdf_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClickOutside}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Document PDF
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {reference.client} - {reference.tech_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 dark:text-red-300 font-bold text-lg">PDF</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {reference.pdf_name || 'document.pdf'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Document de référence pour {reference.client}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleOpenInNewTab}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1651EE] text-white rounded-lg hover:bg-[#1651EE]/90 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir dans un nouvel onglet
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 Le PDF s'ouvrira dans un nouvel onglet de votre navigateur pour une meilleure visualisation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
