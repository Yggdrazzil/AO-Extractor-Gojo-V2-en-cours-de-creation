/**
 * Constantes globales de l'application
 */

// Statuts des différentes entités
export const RFP_STATUSES = ['À traiter', 'Traité'] as const;
export const PROSPECT_STATUSES = ['À traiter', 'Traité'] as const;
export const NEED_STATUSES = ['Ouvert', 'En cours', 'Pourvu', 'Annulé'] as const;

// Ordre de tri des commerciaux
export const SALES_REP_ORDER = ['EPO', 'IKH', 'BVI', 'GMA', 'TSA', 'BCI', 'VIE', 'JVO'];

// Types de fichiers acceptés pour l'upload
export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Clés de stockage local
export const STORAGE_KEYS = {
  OPENAI_API_KEY: 'openai-api-key',
  THEME: 'theme',
  RFP_FORM_EXPANDED: 'rfpFormExpanded',
  PROSPECTS_FORM_EXPANDED: 'prospectsFormExpanded',
  CLIENT_NEEDS_FORM_EXPANDED: 'clientNeedsFormExpanded',
  SELECTED_SALES_REP_RFP: 'selectedSalesRep',
  SELECTED_SALES_REP_PROSPECTS: 'selectedSalesRepProspects',
  SELECTED_SALES_REP_CLIENT_NEEDS: 'selectedSalesRepClientNeeds',
  VISITED_LINKEDIN_LINKS: 'visitedLinkedInLinks',
  getUserSpecificKey: (key: string, email: string) => `${key}_${email}`
};

// Configuration des délais
export const DELAYS = {
  NOTIFICATION_EMAIL: 0.5, // 30 secondes en minutes
  DEBOUNCE_SEARCH: 300, // 300ms
  SCROLL_THROTTLE: 150 // 150ms
};

// Textes par défaut
export const DEFAULT_VALUES = {
  AVAILABILITY: 'À définir',
  RESIDENCE: 'À définir',
  MOBILITY: 'À définir',
  PHONE: 'Non trouvé',
  EMAIL: 'Non trouvé',
  CLIENT: 'Non spécifié',
  MISSION: 'Non spécifié',
  LOCATION: 'Non spécifié'
};

// URLs de l'application
export const URLS = {
  PLATFORM: 'https://hito-gojo-platform.netlify.app/'
};