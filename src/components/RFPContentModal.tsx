import React from 'react';
import { X, Download } from 'lucide-react';
import jsPDF from 'jspdf/dist/jspdf.umd.min.js';

interface RFPContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  client: string;
  mission: string;
}

export function RFPContentModal({ isOpen, onClose, content, client, mission }: RFPContentModalProps) {
  if (!isOpen) return null;

  const formatContent = (text: string) => {
    const sections = [
      "Contexte de la mission",
      "Objectifs et livrables",
      "Compétences demandées",
      "Informations générales"
    ];

    let formattedText = text;
    sections.forEach(section => {
      formattedText = formattedText.replace(
        new RegExp(`(${section})`, 'gi'),
        '\n\n**$1**\n'
      );
    });

    return formattedText.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h3 key={index} className="text-lg font-bold text-blue-600 dark:text-blue-300 mt-6 mb-3">
            {line.replace(/\*\*/g, '')}
          </h3>
        );
      }
      return (
        <p key={index} className="mb-2 text-gray-900 dark:text-gray-100">
          {line}
        </p>
      );
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Configure font sizes
    const titleSize = 16;
    const subtitleSize = 14;
    const bodySize = 12;
    
    // Set title
    doc.setFontSize(titleSize);
    doc.text(client, 20, 20);
    
    // Set mission
    doc.setFontSize(subtitleSize);
    doc.text(mission, 20, 30);
    
    // Format content with sections
    const sections = [
      "Contexte de la mission",
      "Objectifs et livrables",
      "Compétences demandées",
      "Informations générales"
    ];
    
    let y = 50;
    const margin = 20;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - 2 * margin;
    
    // Split content into sections
    let currentContent = content;
    sections.forEach(section => {
      const sectionIndex = currentContent.indexOf(section);
      if (sectionIndex !== -1) {
        // Add section title
        if (y > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(subtitleSize);
        doc.setFont(undefined, 'bold');
        doc.text(section, margin, y);
        y += lineHeight;
        
        // Get section content
        const nextSectionIndex = sections.reduce((closest, nextSection) => {
          const index = currentContent.indexOf(nextSection, sectionIndex + section.length);
          return index !== -1 && index < closest ? index : closest;
        }, currentContent.length);
        
        const sectionContent = currentContent
          .substring(sectionIndex + section.length, nextSectionIndex)
          .trim();
        
        // Add section content
        doc.setFontSize(bodySize);
        doc.setFont(undefined, 'normal');
        
        const lines = doc.splitTextToSize(sectionContent, maxWidth);
        lines.forEach(line => {
          if (y > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            y = 20;
          }
          if (line.trim()) {
            doc.text(line, margin, y);
            y += lineHeight;
          }
        });
        
        y += lineHeight; // Add space between sections
      }
    });
    
    // Format filename: AO_client_mission
    const formatForFilename = (str: string) => {
      return str
        .trim()
        .replace(/[^a-z0-9\s-]/gi, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .toLowerCase();
    };
    
    const filename = `AO_${formatForFilename(client)}_${formatForFilename(mission)}.pdf`;
    
    // Save the PDF
    doc.save(filename);
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{client}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{mission}</p>
          </div>
          <button
            onClick={generatePDF}
            className="mr-2 p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
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
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="prose dark:prose-invert max-w-none">
            {formatContent(content)}
          </div>
        </div>
      </div>
    </div>
  );
}