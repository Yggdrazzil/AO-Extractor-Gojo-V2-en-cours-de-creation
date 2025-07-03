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
  clientToken: string;
  clientKey: string;
  userToken: string;
}

/**
 * Configuration de l'API Boondmanager
 * Les clés doivent être configurées dans les paramètres
 */
function getBoondmanagerConfig(): BoondmanagerApiConfig | null {
  // Essayer d'abord les clés spécifiques à l'utilisateur
  let clientToken = localStorage.getItem('boondmanager-client-token');
  let clientKey = localStorage.getItem('boondmanager-client-key');
  let userToken = localStorage.getItem('boondmanager-user-token');

  // Si pas trouvé, essayer les clés utilisateur spécifiques
  if (!clientToken || !clientKey || !userToken) {
    try {
      const userEmail = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}')?.user?.email;
      if (userEmail) {
        const userPrefix = `boondmanager_${userEmail}_`;
        clientToken = clientToken || localStorage.getItem(`${userPrefix}client-token`);
        clientKey = clientKey || localStorage.getItem(`${userPrefix}client-key`);
        userToken = userToken || localStorage.getItem(`${userPrefix}user-token`);
      }
    } catch (e) {
      console.warn('Could not get user-specific config:', e);
    }
  }

  console.log('🔧 Boondmanager config check:', { 
    hasClientToken: !!clientToken,
    hasClientKey: !!clientKey,
    hasUserToken: !!userToken,
    clientTokenPreview: clientToken ? `${clientToken.substring(0, 8)}...` : 'none',
    clientKeyPreview: clientKey ? `${clientKey.substring(0, 8)}...` : 'none',
    userTokenPreview: userToken ? `${userToken.substring(0, 8)}...` : 'none'
  });

  if (!clientToken || !clientKey || !userToken) {
    console.error('❌ Configuration Boondmanager incomplète:', {
      clientToken: !!clientToken,
      clientKey: !!clientKey,
      userToken: !!userToken
    });
    return null;
  }

  return {
    clientToken: clientToken.trim(),
    clientKey: clientKey.trim(),
    userToken: userToken.trim()
  };
}

/**
 * Effectue un appel à l'API Boondmanager via fonction Edge Supabase
 */
async function callBoondmanagerAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const config = getBoondmanagerConfig();
  
  if (!config) {
    throw new Error('Configuration Boondmanager manquante. Veuillez configurer les tokens dans les paramètres.');
  }

  // Utiliser la fonction Edge Supabase comme proxy
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Configuration Supabase manquante');
  }
  
  const proxyUrl = `${supabaseUrl}/functions/v1/boondmanager-proxy`;
  
  console.log('🔗 Calling Boondmanager API via Supabase proxy:', endpoint);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseKey}`
  };

  console.log('📤 Proxy request:', { 
    endpoint,
    hasConfig: !!(config.clientToken && config.clientKey && config.userToken)
  });

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        endpoint,
        config: {
          clientToken: config.clientToken,
          clientKey: config.clientKey,
          userToken: config.userToken
        }
      })
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Proxy Error Response:', errorData);
      
      if (response.status === 401) {
        throw new Error('Authentification échouée. Vérifiez vos tokens Boondmanager dans les paramètres.');
      } else if (response.status === 403) {
        throw new Error('Accès refusé. Vérifiez les permissions de votre User Token.');
      } else if (response.status === 404) {
        throw new Error('Endpoint non trouvé.');
      } else {
        throw new Error(errorData.error || `Erreur proxy (${response.status})`);
      }
    }

    const data = await response.json();
    console.log('✅ Proxy Response:', data.success ? 'Success' : 'Error');
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur inconnue du proxy');
    }
    
    return data.data;
  } catch (error) {
    console.error('💥 Erreur proxy Boondmanager:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erreur inconnue du proxy Boondmanager');
  }
}

/**
 * Récupère tous les besoins avec les statuts "En Cours" et "Piste Identifiée"
 */
export async function fetchOpenNeeds(): Promise<BoondmanagerNeed[]> {
  try {
    console.log('🔍 Fetching open needs from Boondmanager...');
    
    // Essayer d'abord les opportunités avec filtres
    let response;
    let opportunities;
    
    try {
      response = await callBoondmanagerAPI('/opportunities?state[]=En%20Cours&state[]=Piste%20Identifi%C3%A9e&limit=50');
      opportunities = response.data || response.opportunities || response;
    } catch (error) {
      console.log('❌ Filtered opportunities failed, trying basic endpoint:', error.message);
      try {
        response = await callBoondmanagerAPI('/opportunities?limit=50');
        opportunities = response.data || response.opportunities || response;
      } catch (error2) {
        console.log('❌ Basic opportunities failed, trying projects:', error2.message);
        response = await callBoondmanagerAPI('/projects?limit=50');
        opportunities = response.data || response.projects || response;
      }
    }
    
    if (!Array.isArray(opportunities)) {
      console.error('❌ No array data found in response:', response);
      throw new Error('Format de réponse inattendu de l\'API Boondmanager');
    }
    
    console.log(`✅ Found ${opportunities.length} items from Boondmanager`);
    
    const mappedNeeds = opportunities.map((opportunity: any, index: number) => {
      const state = opportunity.state || opportunity.status || '';
      
      // Filtrer seulement les besoins ouverts
      if (state && !['En Cours', 'Piste Identifiée', 'Open', 'Active', ''].includes(state)) {
        return null;
      }
      
      return {
        id: opportunity.id?.toString() || opportunity.uuid || `temp-${Date.now()}-${index}`,
        title: opportunity.title || opportunity.name || opportunity.subject || opportunity.label || `Besoin ${index + 1}`,
        client: opportunity.company?.name || opportunity.client?.name || opportunity.account?.name || opportunity.customer || 'Client non spécifié',
        description: opportunity.description || opportunity.details || opportunity.comment || opportunity.notes || '',
        status: opportunity.state || opportunity.status || 'En Cours',
        created_at: opportunity.createdAt || opportunity.created_at || opportunity.dateCreated || new Date().toISOString(),
        updated_at: opportunity.updatedAt || opportunity.updated_at || opportunity.dateUpdated || new Date().toISOString()
      };
    }).filter(Boolean); // Supprimer les éléments null
    
    console.log(`✅ Successfully mapped ${mappedNeeds.length} needs:`, mappedNeeds);
    return mappedNeeds;
  } catch (error) {
    console.error('💥 Failed to fetch open needs from Boondmanager:', error);
    throw error;
  }
}

/**
 * Teste la connexion à l'API Boondmanager
 */
export async function testBoondmanagerConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing Boondmanager connection...');
    
    const config = getBoondmanagerConfig();
    if (!config) {
      console.error('❌ No configuration found');
      return false;
    }
    
    // Test simple avec un endpoint basique
    try {
      await callBoondmanagerAPI('/opportunities?limit=1');
      console.log('✅ Connection test successful');
      return true;
    } catch (error) {
      console.log('❌ Connection test failed:', error.message);
      return false;
    }
  } catch (error) {
    console.error('💥 Boondmanager connection test failed:', error);
    return false;
  }
}

/**
 * Récupère les informations d'un besoin spécifique
 */
export async function fetchNeedDetails(needId: string): Promise<BoondmanagerNeed | null> {
  try {
    console.log(`🔍 Fetching details for need: ${needId}`);
    
    const response = await callBoondmanagerAPI(`/opportunities/${needId}`);
    const opportunity = response.data || response;
    
    if (!opportunity || !opportunity.id) {
      console.error('❌ No details found for need:', needId);
      return null;
    }
    
    return {
      id: opportunity.id?.toString() || opportunity.uuid,
      title: opportunity.title || opportunity.name || opportunity.subject || 'Titre non spécifié',
      client: opportunity.company?.name || opportunity.client?.name || opportunity.account?.name || 'Client non spécifié',
      description: opportunity.description || opportunity.details || opportunity.comment || '',
      status: opportunity.state || opportunity.status || 'En Cours',
      created_at: opportunity.createdAt || opportunity.created_at || opportunity.dateCreated || new Date().toISOString(),
      updated_at: opportunity.updatedAt || opportunity.updated_at || opportunity.dateUpdated || new Date().toISOString()
    };
  } catch (error) {
    console.error('💥 Failed to fetch need details:', error);
    return null;
  }
}