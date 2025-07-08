import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  fullScreen?: boolean;
}

/**
 * Composant de spinner de chargement réutilisable
 */
export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  text,
  fullScreen = false
}: LoadingSpinnerProps) {
  // Tailles du spinner
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3'
  };

  // Couleurs du spinner
  const colorClasses = {
    primary: 'border-blue-600',
    secondary: 'border-gray-600',
    white: 'border-white'
  };

  // Classes du conteneur
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50'
    : 'flex items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-2">
        <div
          className={`animate-spin rounded-full border-b-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
        />
        {text && (
          <p className={`text-${color === 'white' ? 'white' : 'gray-600 dark:text-gray-400'}`}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}