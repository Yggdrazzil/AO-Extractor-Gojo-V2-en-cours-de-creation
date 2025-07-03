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
 * Récupère tous les besoins avec les statuts "En Cours" et "Piste Identifiée"
 */
export async function fetchOpenNeeds(): Promise<BoondmanagerNeed[]> {
  try {
    console.log('Fetching open needs from Boondmanager...');
    
    // Selon la documentation Boondmanager, l'endpoint pour les opportunités est /api/opportunities
    // On filtre par statut "En Cours" et "Piste Identifiée"
    const response = await callBoondmanagerAPI('/api/opportunities?state[]=En%20Cours&state[]=Piste%20Identifi%C3%A9e');
    
    // La réponse contient généralement un tableau d'opportunités
    const opportunities = response.data || response.opportunities || response;
    
    if (!Array.isArray(opportunities)) {
      console.error('Unexpected response format:', response);
      throw new Error('Format de réponse inattendu de l\'API Boondmanager');
    }
    
    return opportunities.map((opportunity: any) => ({
      id: opportunity.id?.toString() || opportunity.uuid,
      title: opportunity.title || opportunity.name || opportunity.subject || 'Titre non spécifié',
      client: opportunity.company?.name || opportunity.client?.name || opportunity.account?.name || 'Client non spécifié',
      description: opportunity.description || opportunity.details || opportunity.comment,
      status: opportunity.state || opportunity.status || 'En Cours',
      created_at: opportunity.createdAt || opportunity.created_at || opportunity.dateCreated,
      updated_at: opportunity.updatedAt || opportunity.updated_at || opportunity.dateUpdated
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
    // Test simple avec l'endpoint des opportunités
    await callBoondmanagerAPI('/api/opportunities?limit=1');
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
    const response = await callBoondmanagerAPI(`/api/opportunities/${needId}`);
    const opportunity = response.data || response;
    
    return {
      id: opportunity.id?.toString() || opportunity.uuid,
      title: opportunity.title || opportunity.name || opportunity.subject || 'Titre non spécifié',
      client: opportunity.company?.name || opportunity.client?.name || opportunity.account?.name || 'Client non spécifié',
      description: opportunity.description || opportunity.details || opportunity.comment,
      status: opportunity.state || opportunity.status || 'En Cours',
      created_at: opportunity.createdAt || opportunity.created_at || opportunity.dateCreated,
      updated_at: opportunity.updatedAt || opportunity.updated_at || opportunity.dateUpdated
    };
  } catch (error) {
    console.error('Failed to fetch need details:', error);
    return null;
  }
}