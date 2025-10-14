import React from 'react';
import { X, Download } from 'lucide-react';
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
      window.open(reference.pdf_url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {reference.pdf_name || 'Document PDF'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {reference.client} - {reference.tech_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-[#1651EE] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Télécharger"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          <iframe
            src={reference.pdf_url}
            className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700"
            title="PDF Viewer"
          />
        </div>
      </div>
    </div>
  );
}
