import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Composant pour capturer et gérer les erreurs dans l'arbre de composants
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Journaliser l'erreur
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Appeler le callback onError si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Afficher le fallback personnalisé ou par défaut
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function' && this.state.error) {
          return this.props.fallback(this.state.error, this.resetError);
        }
        return this.props.fallback;
      }

      // Fallback par défaut
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Une erreur est survenue</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {this.state.error?.message || 'Une erreur inattendue s\'est produite.'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={this.resetError}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réessayer
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Recharger la page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}