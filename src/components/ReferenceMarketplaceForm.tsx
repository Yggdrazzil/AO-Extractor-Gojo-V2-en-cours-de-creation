import React, { useState, useEffect } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import type { SalesRep } from '../types';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../services/fileUpload';

interface ReferenceMarketplaceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    client: string;
    operational_contact: string;
    phone: string;
    email: string;
    tech_name: string;
    sales_rep_id: string | null;
    pdf_url: string | null;
    pdf_name: string | null;
  }) => Promise<void>;
}

export function ReferenceMarketplaceForm({ isOpen, onClose, onSubmit }: ReferenceMarketplaceFormProps) {
  const [formData, setFormData] = useState({
    client: '',
    operational_contact: '',
    phone: '',
    email: '',
    tech_name: '',
    sales_rep_id: ''
  });
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSalesReps();
  }, []);

  const fetchSalesReps = async () => {
    const { data, error } = await supabase
      .from('sales_reps')
      .select('*')
      .order('name');

    if (!error && data) {
      setSalesReps(data);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('Veuillez sélectionner un fichier PDF');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('Veuillez déposer un fichier PDF');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      let pdfUrl = null;
      let pdfName = null;

      if (pdfFile) {
        setIsUploading(true);
        const uploadResult = await uploadFile(pdfFile, 'reference-pdfs');
        pdfUrl = uploadResult.url;
        pdfName = pdfFile.name;
        setIsUploading(false);
      }

      await onSubmit({
        ...formData,
        sales_rep_id: formData.sales_rep_id || null,
        pdf_url: pdfUrl,
        pdf_name: pdfName
      });

      setFormData({
        client: '',
        operational_contact: '',
        phone: '',
        email: '',
        tech_name: '',
        sales_rep_id: ''
      });
      setPdfFile(null);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Ajouter une Référence
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Opérationnel à Contacter <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.operational_contact}
              onChange={(e) => setFormData({ ...formData, operational_contact: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom du Tech
            </label>
            <input
              type="text"
              value={formData.tech_name}
              onChange={(e) => setFormData({ ...formData, tech_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Commercial <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.sales_rep_id}
              onChange={(e) => setFormData({ ...formData, sales_rep_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Sélectionner un commercial</option>
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name} ({rep.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document PDF (optionnel)
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-[#1651EE] transition-colors cursor-pointer"
              onClick={() => document.getElementById('pdf-upload')?.click()}
            >
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {pdfFile ? (
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <FileText className="w-5 h-5" />
                  <span>{pdfFile.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Glissez-déposez un PDF ou cliquez pour sélectionner
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-4 py-2 bg-[#1651EE] text-white rounded-lg hover:bg-[#1651EE]/90 transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Upload en cours...' : isSubmitting ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
