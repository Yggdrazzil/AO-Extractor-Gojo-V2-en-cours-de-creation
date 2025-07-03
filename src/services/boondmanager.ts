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
 * Effectue un appel à l'API Boondmanager
 */
async function callBoondmanagerAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const config = getBoondmanagerConfig();
  
  if (!config) {
    throw new Error('Configuration Boondmanager manquante. Veuillez configurer le Client Token, Client Key et User Token dans les paramètres.');
  }

  // URL de base de l'API Boondmanager (selon la documentation)
  const baseUrl = 'https://api.boondmanager.com';
  const url = `${baseUrl}${endpoint}`;
  
  console.log('🔗 Calling Boondmanager API:', url);
  
  // Construire le JWT selon la documentation
  const jwtToken = `${config.clientToken}.${config.clientKey}.${config.userToken}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Jwt-Client-BoondManager': jwtToken,
    ...((options.headers as Record<string, string>) || {})
  };

  console.log('📤 Request details:', { 
    url,
    method: options.method || 'GET',
    headers: { 
      ...headers, 
      'X-Jwt-Client-BoondManager': `${config.clientToken.substring(0, 4)}...${config.clientKey.substring(0, 4)}...${config.userToken.substring(0, 4)}...` 
    }
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'omit'
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      
      if (response.status === 401) {
        throw new Error('Authentification échouée. Vérifiez vos tokens Boondmanager :\n• Client Token et Client Key : disponibles dans l\'interface administrateur > dashboard\n• User Token : disponible dans votre interface utilisateur > paramètres > sécurité');
      } else if (response.status === 403) {
        throw new Error('Accès refusé. Vérifiez les permissions de votre User Token.');
      } else if (response.status === 404) {
        throw new Error('Endpoint non trouvé. L\'API Boondmanager pourrait avoir changé.');
      } else if (response.status === 0) {
        throw new Error('Problème CORS : L\'API Boondmanager bloque les requêtes depuis le navigateur. Contactez votre administrateur Boondmanager pour configurer les CORS.');
      } else {
        throw new Error(`Erreur API Boondmanager (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('✅ API Response data:', data);
    return data;
  } catch (error) {
    console.error('💥 Erreur lors de l\'appel à l\'API Boondmanager:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('❌ PROBLÈME DE CONNEXION :\n\n1. Vérifiez votre connexion internet\n2. L\'API Boondmanager pourrait bloquer les requêtes depuis le navigateur (CORS)\n3. Contactez votre administrateur Boondmanager\n\nL\'API doit autoriser les requêtes depuis ' + window.location.origin);
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erreur inconnue lors de l\'appel à l\'API Boondmanager');
  }
}

/**
 * Récupère tous les besoins avec les statuts "En Cours" et "Piste Identifiée"
 */
export async function fetchOpenNeeds(): Promise<BoondmanagerNeed[]> {
  try {
    console.log('🔍 Fetching open needs from Boondmanager...');
    
    // Liste des endpoints à essayer selon la documentation Boondmanager
    const endpointsToTry = [
      '/opportunities?state[]=En%20Cours&state[]=Piste%20Identifi%C3%A9e&limit=50',
      '/opportunities?limit=50',
      '/opportunities',
      '/needs?limit=50',
      '/needs',
      '/projects?limit=50',
      '/projects'
    ];
    
    let response;
    let opportunities;
    let lastError;
    
    for (const endpoint of endpointsToTry) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        response = await callBoondmanagerAPI(endpoint);
        
        // Essayer différentes structures de réponse
        opportunities = response.data || response.opportunities || response.needs || response.projects || response;
        
        if (Array.isArray(opportunities)) {
          console.log(`✅ Success with ${endpoint}, found ${opportunities.length} items`);
          break;
        } else if (opportunities && typeof opportunities === 'object') {
          // Chercher un tableau dans l'objet
          const possibleArrays = Object.values(opportunities).filter(Array.isArray);
          if (possibleArrays.length > 0) {
            opportunities = possibleArrays[0];
            console.log(`✅ Success with ${endpoint}, found array with ${opportunities.length} items`);
            break;
          }
        }
        
        console.log(`⚠️ ${endpoint} returned non-array data:`, typeof opportunities);
      } catch (error) {
        console.log(`❌ ${endpoint} failed:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    if (!Array.isArray(opportunities)) {
      console.error('❌ No valid endpoint found. Last response:', response);
      throw lastError || new Error('Aucun endpoint valide trouvé pour récupérer les besoins. Vérifiez la configuration de l\'API.');
    }
    
    // Filtrer côté client si nécessaire
    const filteredOpportunities = opportunities.filter((opp: any) => {
      const state = opp.state || opp.status || '';
      return !state || state === 'En Cours' || state === 'Piste Identifiée' || state === 'Open' || state === 'Active';
    });
    
    console.log(`🔍 Filtered ${opportunities.length} items to ${filteredOpportunities.length} open needs`);
    
    const mappedNeeds = filteredOpportunities.map((opportunity: any, index: number) => {
      console.log(`📝 Mapping opportunity ${index}:`, {
        id: opportunity.id,
        title: opportunity.title || opportunity.name,
        client: opportunity.company?.name || opportunity.client?.name
      });
      
      return {
        id: opportunity.id?.toString() || opportunity.uuid || `temp-${Date.now()}-${index}`,
        title: opportunity.title || opportunity.name || opportunity.subject || opportunity.label || `Besoin ${index + 1}`,
        client: opportunity.company?.name || opportunity.client?.name || opportunity.account?.name || opportunity.customer || 'Client non spécifié',
        description: opportunity.description || opportunity.details || opportunity.comment || opportunity.notes || '',
        status: opportunity.state || opportunity.status || 'En Cours',
        created_at: opportunity.createdAt || opportunity.created_at || opportunity.dateCreated || new Date().toISOString(),
        updated_at: opportunity.updatedAt || opportunity.updated_at || opportunity.dateUpdated || new Date().toISOString()
      };
    });
    
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
    
    console.log('🧪 Testing with config:', {
      hasTokens: !!(config.clientToken && config.clientKey && config.userToken)
    });
    
    // Essayer plusieurs endpoints pour tester la connexion
    const testEndpoints = [
      '/opportunities?limit=1',
      '/opportunities',
      '/needs?limit=1', 
      '/needs',
      '/projects?limit=1',
      '/projects'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`🧪 Testing endpoint: https://api.boondmanager.com${endpoint}`);
        await callBoondmanagerAPI(endpoint);
        console.log(`✅ Connection test successful with ${endpoint}`);
        return true;
      } catch (error) {
        console.log(`❌ Test failed for ${endpoint}:`, error.message);
        
        // Si c'est un problème CORS, on arrête les tests
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
          console.error('❌ CORS issue detected, stopping tests');
          return false;
        }
        
        continue;
      }
    }
    
    console.error('❌ All connection tests failed');
    return false;
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
    
    let response;
    let opportunity;
    
    const detailEndpoints = [
      `/opportunities/${needId}`,
      `/needs/${needId}`,
      `/projects/${needId}`
    ];
    
    for (const endpoint of detailEndpoints) {
      try {
        console.log(`🔄 Trying detail endpoint: ${endpoint}`);
        response = await callBoondmanagerAPI(endpoint);
        opportunity = response.data || response;
        
        if (opportunity && opportunity.id) {
          console.log(`✅ Found details with ${endpoint}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Detail endpoint ${endpoint} failed:`, error.message);
        continue;
      }
    }
    
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