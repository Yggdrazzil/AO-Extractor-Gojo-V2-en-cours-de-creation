/**
 * Utilitaires pour la gestion des erreurs
 */

/**
 * Formate un message d'erreur pour l'affichage
 * @param error - L'erreur à formater
 * @returns Message d'erreur formaté
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null) {
    // Essayer de récupérer un message d'erreur dans l'objet
    const errorObj = error as Record<string, any>;
    if (errorObj.message) {
      return String(errorObj.message);
    }
    if (errorObj.error) {
      return String(errorObj.error);
    }
  }
  
  return 'Une erreur inconnue est survenue';
}

/**
 * Gère les erreurs Supabase et retourne un message utilisateur approprié
 * @param error - L'erreur Supabase
 * @returns Message d'erreur utilisateur
 */
export function handleSupabaseError(error: any): string {
  // Vérifier le code d'erreur Supabase
  if (error?.code === 'PGRST301') {
    return 'Session expirée. Veuillez vous reconnecter.';
  }
  
  if (error?.code === '42501') {
    return 'Permissions insuffisantes pour accéder aux données.';
  }
  
  if (error?.code === '23505') {
    return 'Cette entrée existe déjà.';
  }
  
  if (error?.code === '23503') {
    return 'Cette opération n\'est pas possible car cette donnée est référencée ailleurs.';
  }
  
  // Erreur d'authentification
  if (error?.message?.includes('Invalid login credentials')) {
    return 'Identifiants invalides. Veuillez réessayer.';
  }
  
  // Erreur générique
  return formatErrorMessage(error);
}

/**
 * Journalise une erreur avec des informations contextuelles
 * @param error - L'erreur à journaliser
 * @param context - Contexte de l'erreur
 */
export function logError(error: unknown, context: string): void {
  console.error(`[${context}] Error:`, error);
  
  // Ajouter ici d'autres logiques de journalisation si nécessaire
  // Par exemple, envoyer l'erreur à un service de monitoring
}

/**
 * Classe d'erreur personnalisée pour les erreurs métier
 */
export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

/**
 * Classe d'erreur personnalisée pour les erreurs d'API
 */
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Classe d'erreur personnalisée pour les erreurs de validation
 */
export class ValidationError extends Error {
  field?: string;
  
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}