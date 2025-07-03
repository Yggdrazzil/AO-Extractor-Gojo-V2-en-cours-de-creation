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
  clientToken: string;
  clientKey: string;
  userToken: string;
}

/**
 * Configuration de l'API Boondmanager
 * Les clés doivent être configurées dans les paramètres
 */
function getBoondmanagerConfig(): BoondmanagerApiConfig | null {
  const baseUrl = localStorage.getItem('boondmanager-base-url');
  const clientToken = localStorage.getItem('boondmanager-client-token');
  const clientKey = localStorage.getItem('boondmanager-client-key');
  const userToken = localStorage.getItem('boondmanager-user-token');

  console.log('Boondmanager config:', { 
    hasBaseUrl: !!baseUrl, 
    hasClientToken: !!clientToken,
    hasClientKey: !!clientKey,
    hasUserToken: !!userToken,
    baseUrl: baseUrl,
    clientToken: clientToken ? `${clientToken.substring(0, 4)}...` : 'none'
  });

  if (!baseUrl || !clientToken || !clientKey || !userToken) {
    return null;
  }

  return {
    baseUrl: baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl,
    clientToken,
    clientKey,
    userToken
  };
}

/**
 * Effectue un appel à l'API Boondmanager
 */
async function callBoondmanagerAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const config = getBoondmanagerConfig();
  
  if (!config) {
    throw new Error('Configuration Boondmanager manquante. Veuillez configurer le Client Token, Client Key et User Token dans les paramètres.');
  }

  // Construire l'URL complète
  const url = `${config.baseUrl}${endpoint}`;
  console.log('Calling Boondmanager API:', url);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Jwt-Client-BoondManager': `${config.clientToken}.${config.clientKey}.${config.userToken}`,
    ...((options.headers as Record<string, string>) || {})
  };

  console.log('Request headers:', { 
    ...headers, 
    'X-Jwt-Client-BoondManager': `${config.clientToken.substring(0, 4)}...${config.clientKey.substring(0, 4)}...${config.userToken.substring(0, 4)}...` 
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors'
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Erreur API Boondmanager (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response data:', data);
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'appel à l\'API Boondmanager:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Impossible de se connecter à Boondmanager. Vérifiez l\'URL et que l\'API est accessible depuis votre navigateur.');
    }
    throw error;
  }
}

/**
 * Récupère tous les besoins avec les statuts "En Cours" et "Piste Identifiée"
 */
export async function fetchOpenNeeds(): Promise<BoondmanagerNeed[]> {
  try {
    console.log('Fetching open needs from Boondmanager...');
    
    // Essayer différents endpoints possibles selon la documentation Boondmanager
    let response;
    let opportunities;
    
    try {
      // Essai 1: endpoint opportunities avec filtres
      console.log('Trying /api/opportunities endpoint...');
      response = await callBoondmanagerAPI('/api/opportunities?state[]=En%20Cours&state[]=Piste%20Identifi%C3%A9e');
      opportunities = response.data || response.opportunities || response;
    } catch (error) {
      console.log('First attempt failed, trying alternative endpoints...');
      
      try {
        // Essai 2: endpoint opportunities sans filtres
        console.log('Trying /api/opportunities without filters...');
        response = await callBoondmanagerAPI('/api/opportunities');
        opportunities = response.data || response.opportunities || response;
        
        // Filtrer côté client si nécessaire
        if (Array.isArray(opportunities)) {
          opportunities = opportunities.filter((opp: any) => {
            const state = opp.state || opp.status || '';
            return state === 'En Cours' || state === 'Piste Identifiée';
          });
        }
      } catch (error2) {
        console.log('Second attempt failed, trying /api/needs...');
        
        // Essai 3: endpoint needs
        response = await callBoondmanagerAPI('/api/needs');
        opportunities = response.data || response.needs || response;
      }
    }
    
    if (!Array.isArray(opportunities)) {
      console.error('Unexpected response format:', response);
      console.log('Response type:', typeof opportunities);
      
      // Si c'est un objet avec une propriété contenant les données
      if (typeof opportunities === 'object' && opportunities !== null) {
        const possibleArrays = Object.values(opportunities).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          opportunities = possibleArrays[0];
          console.log('Found array in response:', opportunities.length, 'items');
        } else {
          throw new Error('Aucun tableau trouvé dans la réponse de l\'API Boondmanager');
        }
      } else {
        throw new Error('Format de réponse inattendu de l\'API Boondmanager');
      }
    }
    
    console.log('Found opportunities:', opportunities.length);
    
    const mappedNeeds = opportunities.map((opportunity: any, index: number) => {
      console.log(`Mapping opportunity ${index}:`, opportunity);
      
      return {
        id: opportunity.id?.toString() || opportunity.uuid || `temp-${index}`,
        title: opportunity.title || opportunity.name || opportunity.subject || opportunity.label || 'Titre non spécifié',
        client: opportunity.company?.name || opportunity.client?.name || opportunity.account?.name || opportunity.customer || 'Client non spécifié',
        description: opportunity.description || opportunity.details || opportunity.comment || opportunity.notes,
        status: opportunity.state || opportunity.status || 'En Cours',
        created_at: opportunity.createdAt || opportunity.created_at || opportunity.dateCreated || new Date().toISOString(),
        updated_at: opportunity.updatedAt || opportunity.updated_at || opportunity.dateUpdated || new Date().toISOString()
      };
    });
    
    console.log('Mapped needs:', mappedNeeds);
    return mappedNeeds;
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
    console.log('Testing Boondmanager connection...');
    
    // Essayer plusieurs endpoints pour tester la connexion
    try {
      await callBoondmanagerAPI('/api/opportunities?limit=1');
      console.log('Connection test successful with /api/opportunities');
      return true;
    } catch (error) {
      console.log('First test failed, trying alternative...');
      
      try {
        await callBoondmanagerAPI('/api/needs?limit=1');
        console.log('Connection test successful with /api/needs');
        return true;
      } catch (error2) {
        console.log('Second test failed, trying basic endpoint...');
        
        // Essayer un endpoint très basique
        await callBoondmanagerAPI('/api');
        console.log('Connection test successful with /api');
        return true;
      }
    }
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
    let response;
    let opportunity;
    
    try {
      response = await callBoondmanagerAPI(`/api/opportunities/${needId}`);
      opportunity = response.data || response;
    } catch (error) {
      // Essayer avec l'endpoint needs
      response = await callBoondmanagerAPI(`/api/needs/${needId}`);
      opportunity = response.data || response;
    }
    
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