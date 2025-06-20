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
    
    // Configure font sizes and margins
    const titleSize = 16;
    const subtitleSize = 14;
    const bodySize = 12;
    const margin = 20;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - 2 * margin;
    
    let y = 20;
    
    // Set title
    doc.setFontSize(titleSize);
    doc.setFont(undefined, 'bold');
    doc.text(client, margin, y);
    y += lineHeight + 5;
    
    // Set mission
    doc.setFontSize(subtitleSize);
    doc.setFont(undefined, 'normal');
    doc.text(mission, margin, y);
    y += lineHeight + 10;
    
    // Add a separator line
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Set body font
    doc.setFontSize(bodySize);
    doc.setFont(undefined, 'normal');
    
    // Split content into lines and process each line
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines but add some spacing
      if (!line) {
        y += lineHeight / 2;
        continue;
      }
      
      // Check if we need a new page
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;
      }
      
      // Check if this line looks like a section header
      const sectionHeaders = [
        "Contexte de la mission",
        "Objectifs et livrables", 
        "Compétences demandées",
        "Informations générales",
        "Description de la mission",
        "Profil recherché",
        "Compétences techniques",
        "Compétences fonctionnelles"
      ];
      
      const isHeader = sectionHeaders.some(header => 
        line.toLowerCase().includes(header.toLowerCase())
      );
      
      if (isHeader) {
        // Add some space before section headers
        if (i > 0) {
          y += lineHeight;
        }
        
        // Check if we need a new page after adding space
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }
        
        // Format as section header
        doc.setFontSize(subtitleSize);
        doc.setFont(undefined, 'bold');
        const headerLines = doc.splitTextToSize(line, maxWidth);
        headerLines.forEach(headerLine => {
          doc.text(headerLine, margin, y);
          y += lineHeight;
        });
        y += 3; // Extra space after headers
        
        // Reset to normal font for next content
        doc.setFontSize(bodySize);
        doc.setFont(undefined, 'normal');
      } else {
        // Regular content line
        doc.setFontSize(bodySize);
        doc.setFont(undefined, 'normal');
        
        // Split long lines to fit page width
        const wrappedLines = doc.splitTextToSize(line, maxWidth);
        
        wrappedLines.forEach(wrappedLine => {
          // Check if we need a new page
          if (y > pageHeight - 30) {
            doc.addPage();
            y = 20;
          }
          
          if (wrappedLine.trim()) {
            doc.text(wrappedLine, margin, y);
            y += lineHeight;
          }
        });
      }
    }
    
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