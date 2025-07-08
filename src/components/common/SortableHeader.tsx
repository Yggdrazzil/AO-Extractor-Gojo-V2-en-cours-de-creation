import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSortField: string | null;
  currentSortDirection: 'asc' | 'desc' | null;
  onSort: (field: string) => void;
  className?: string;
}

/**
 * Composant d'en-tête de tableau triable
 */
export function SortableHeader({
  label,
  field,
  currentSortField,
  currentSortDirection,
  onSort,
  className = ''
}: SortableHeaderProps) {
  // Détermine l'icône à afficher en fonction de l'état de tri
  const getSortIcon = () => {
    if (currentSortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    
    if (currentSortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4" />;
    }
    
    if (currentSortDirection === 'desc') {
      return <ArrowDown className="w-4 h-4" />;
    }
    
    return <ArrowUpDown className="w-4 h-4 opacity-50" />;
  };

  return (
    <th 
      className={`p-2 sm:p-4 font-medium text-gray-600 dark:text-gray-200 cursor-pointer select-none ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1 sm:gap-2">
        <span className="text-xs sm:text-sm">{label}</span>
        {getSortIcon()}
      </div>
    </th>
  );
}