import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'read' | 'unread';
  size?: 'sm' | 'md';
}

/**
 * Composant de badge de statut réutilisable
 */
export function StatusBadge({ status, variant = 'default', size = 'md' }: StatusBadgeProps) {
  // Styles pour les différents statuts
  const getStatusStyle = () => {
    // Styles pour les statuts de lecture
    if (variant === 'read') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    
    if (variant === 'unread') {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
    
    // Styles pour les statuts d'entités
    switch (status) {
      case 'À traiter':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Traité':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'En cours':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Refusé':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Ouvert':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Pourvu':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Annulé':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Taille du badge
  const sizeClass = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center rounded-full ${sizeClass} ${getStatusStyle()}`}>
      {status}
    </span>
  );
}