import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

/**
 * Composant de pagination réutilisable
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1
}: PaginationProps) {
  // Pas besoin de pagination s'il n'y a qu'une seule page
  if (totalPages <= 1) return null;

  // Génère la liste des pages à afficher
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Toujours afficher la première page
    pageNumbers.push(1);
    
    // Calculer la plage de pages autour de la page courante
    const leftSibling = Math.max(2, currentPage - siblingCount);
    const rightSibling = Math.min(totalPages - 1, currentPage + siblingCount);
    
    // Ajouter des points de suspension si nécessaire
    if (leftSibling > 2) {
      pageNumbers.push('...');
    }
    
    // Ajouter les pages dans la plage
    for (let i = leftSibling; i <= rightSibling; i++) {
      pageNumbers.push(i);
    }
    
    // Ajouter des points de suspension si nécessaire
    if (rightSibling < totalPages - 1) {
      pageNumbers.push('...');
    }
    
    // Toujours afficher la dernière page si elle existe
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Page précédente"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      {getPageNumbers().map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-3 py-2 text-gray-500 dark:text-gray-400">...</span>
          ) : (
            <button
              onClick={() => typeof page === 'number' && onPageChange(page)}
              className={`px-3 py-1 rounded-md ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
              }`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Page suivante"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}