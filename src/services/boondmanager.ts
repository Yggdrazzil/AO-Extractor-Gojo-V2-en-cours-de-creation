/**
 * Service pour l'intégration avec l'API Boondmanager
 */

export interface BoondmanagerNeed {
  id: string;
  title: string;
  client: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BoondmanagerApiConfig {
  baseUrl: string;
  apiKey: string;
  username?: string;
  password?: string;
}

/**
 * Configuration de l'API Boondmanager
 * Les clés doivent être configurées dans les paramètres
 */
function getBoondmanagerConfig(): BoondmanagerApiConfig | null {
  const baseUrl = localStorage.getItem('boondmanager-base-url');
  const apiKey = localStorage.getItem('boondmanager-api-key');
  const username = localStorage.getItem('boondmanager-username');
  const password = localStorage.getItem('boondmanager-password');

  if (!baseUrl || !apiKey) {
    return null;
  }

  return {
    baseUrl,
    apiKey,
    username: username || undefined,
    password: password || undefined
  };
}

/**
 * Effectue un appel à l'API Boondmanager
 */
async function callBoondmanagerAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const config = getBoondmanagerConfig();
  
  if (!config) {
    throw new Error('Configuration Boondmanager manquante. Veuillez configurer l\'API dans les paramètres.');
  }

  const url = `${config.baseUrl}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-KEY': config.apiKey,
    ...((options.headers as Record<string, string>) || {})
  };

  // Authentification Basic si username/password fournis
  if (config.username && config.password) {
    const credentials = btoa(`${config.username}:${config.password}`);
    headers['Authorization'] = `Basic ${credentials}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API Boondmanager (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'appel à l\'API Boondmanager:', error);
    throw error;
  }
}

/**
 * Récupère tous les besoins ouverts depuis Boondmanager
 */
export async function fetchOpenNeeds(): Promise<BoondmanagerNeed[]> {
  try {
    console.log('Fetching open needs from Boondmanager...');
    
    // Endpoint pour récupérer les besoins/opportunités ouvertes
    // L'endpoint exact peut varier selon la version de l'API Boondmanager
    const response = await callBoondmanagerAPI('/api/v1/needs?status=open');
    
    // Adapter la structure de données selon la réponse de l'API
    const needs = response.data || response.needs || response;
    
    return needs.map((need: any) => ({
      id: need.id || need.uuid,
      title: need.title || need.name || need.subject,
      client: need.client?.name || need.company?.name || need.client_name || 'Client non spécifié',
      description: need.description || need.details,
      status: need.status || 'open',
      created_at: need.created_at || need.createdAt,
      updated_at: need.updated_at || need.updatedAt
    }));
  } catch (error) {
    console.error('Failed to fetch open needs from Boondmanager:', error);
    throw error;
  }
}

/**
 * Teste la connexion à l'API Boondmanager
 */
export async function testBoondmanagerConnection(): Promise<boolean> {
  try {
    // Test simple avec un endpoint de base (peut varier selon l'API)
    await callBoondmanagerAPI('/api/v1/ping');
    return true;
  } catch (error) {
    console.error('Boondmanager connection test failed:', error);
    return false;
  }
}

/**
 * Récupère les informations d'un besoin spécifique
 */
export async function fetchNeedDetails(needId: string): Promise<BoondmanagerNeed | null> {
  try {
    const response = await callBoondmanagerAPI(`/api/v1/needs/${needId}`);
    const need = response.data || response;
    
    return {
      id: need.id || need.uuid,
      title: need.title || need.name || need.subject,
      client: need.client?.name || need.company?.name || need.client_name || 'Client non spécifié',
      description: need.description || need.details,
      status: need.status || 'open',
      created_at: need.created_at || need.createdAt,
      updated_at: need.updated_at || need.updatedAt
    };
  } catch (error) {
    console.error('Failed to fetch need details:', error);
    return null;
  }
}