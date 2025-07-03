/**
 * Service pour l'intégration avec l'API Boondmanager
 * Basé sur la documentation officielle : https://doc.boondmanager.com/api-externe/
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
  username: string;
  password: string;
  customerCode?: string;
}

/**
 * Configuration de l'API Boondmanager selon la documentation officielle
 */
function getBoondmanagerConfig(): BoondmanagerApiConfig | null {
  // Essayer d'abord les clés globales
  let username = localStorage.getItem('boondmanager-username');
  let password = localStorage.getItem('boondmanager-password');

  // Si pas trouvé, essayer les clés utilisateur spécifiques
  if (!username || !password) {
    try {
      // Récupérer l'email utilisateur depuis le localStorage de Supabase
      const supabaseAuth = localStorage.getItem('sb-onuznsfzlkguvfdeilff-auth-token');
      if (supabaseAuth) {
        const authData = JSON.parse(supabaseAuth);
        const userEmail = authData?.user?.email;
        
        if (userEmail) {
          const userPrefix = `boondmanager_${userEmail}_`;
          username = username || localStorage.getItem(`${userPrefix}username`);
          password = password || localStorage.getItem(`${userPrefix}password`);
        }
      }
    } catch (e) {
      console.warn('Could not get user-specific config:', e);
    }
  }

  console.log('🔧 Boondmanager config check:', { 
    hasUsername: !!username,
    hasPassword: !!password,
    usernamePreview: username ? username.substring(0, 8) + '...' : 'none'
  });

  if (!username || !password) {
    console.error('❌ Configuration Boondmanager incomplète');
    return null;
  }

  return {
    username: username.trim(),
    password: password.trim(),
    customerCode: 'hito' // Code client spécifique pour votre entreprise
  };
}

/**
 * Effectue un appel à l'API Boondmanager selon la documentation officielle
 * URL de base : https://api.boondmanager.com
 * Authentification : Basic Auth avec customerCode
 */
async function callBoondmanagerAPI(endpoint: string, config: BoondmanagerApiConfig): Promise<any> {
  // URL de base selon la documentation officielle
  const baseUrl = 'https://api.boondmanager.com';
  
  // Construire l'URL avec le customerCode si nécessaire
  let url = `${baseUrl}${endpoint}`;
  
  // Ajouter le customerCode selon la documentation
  if (config.customerCode) {
    const separator = endpoint.includes('?') ? '&' : '?';
    url += `${separator}customerCode=${config.customerCode}`;
  }
  
  console.log('🔗 Calling Boondmanager API:', url);
  
  // Authentification Basic selon la documentation
  const credentials = btoa(`${config.username}:${config.password}`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Basic ${credentials}`,
    'User-Agent': 'Hito-API-Client/1.0'
  };

  console.log('📤 Request headers:', { 
    ...headers, 
    'Authorization': `Basic ${config.username.substring(0, 4)}...` 
  });

  try {
    const response = await fetch(url, {
      method: 'GET',
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
        throw new Error(`❌ AUTHENTIFICATION ÉCHOUÉE\n\nVos identifiants Boondmanager sont incorrects.\n✅ Vérifiez votre email et mot de passe dans les paramètres ⚙️\n💡 Utilisez les mêmes que pour ui.boondmanager.com/login?customerCode=hito`);
      } else if (response.status === 403) {
        throw new Error(`❌ ACCÈS REFUSÉ\n\nVotre compte n'a pas accès à l'API.\n💡 Contactez votre administrateur Boondmanager.`);
      } else if (response.status === 404) {
        throw new Error(`❌ ENDPOINT NON TROUVÉ\n\nL'endpoint ${endpoint} n'existe pas.\nVérifiez la documentation API.`);
      } else {
        throw new Error(`❌ ERREUR API BOONDMANAGER (${response.status})\n\n${errorText}`);
      }
    }

    const data = await response.json();
    console.log('✅ API Response data:', data);
    return data;
  } catch (error) {
    console.error('💥 Erreur lors de l\'appel à l\'API Boondmanager:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`❌ PROBLÈME DE CONNEXION\n\n1. Vérifiez votre connexion internet\n2. L'API Boondmanager pourrait bloquer les requêtes CORS\n3. Essayez de vous connecter à ${baseUrl} dans votre navigateur\n\n💡 Si le problème persiste, l'API pourrait ne pas supporter les requêtes depuis le navigateur.`);
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erreur inconnue lors de l\'appel à l\'API Boondmanager');
  }
}

/**
 * Récupère les opportunités ouvertes selon la documentation officielle
 */
export async function fetchOpenNeeds(): Promise<BoondmanagerNeed[]> {
  try {
    console.log('🔍 Fetching opportunities from Boondmanager...');
    
    const config = getBoondmanagerConfig();
    if (!config) {
      throw new Error('❌ CONFIGURATION MANQUANTE\n\nVeuillez configurer votre email et mot de passe Boondmanager dans les paramètres ⚙️');
    }

    // Endpoints à essayer selon la documentation
    const endpointsToTry = [
      '/opportunities',
      '/opportunities?limit=50',
      '/api/opportunities',
      '/api/opportunities?limit=50'
    ];
    
    let opportunities;
    let lastError;
    
    for (const endpoint of endpointsToTry) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        const response = await callBoondmanagerAPI(endpoint, config);
        
        // Extraire les données selon différents formats possibles
        opportunities = response.data || response.opportunities || response.results || response;
        
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
      console.error('❌ No valid endpoint found. Last response:', opportunities);
      throw lastError || new Error('Aucun endpoint valide trouvé pour récupérer les opportunités. Vérifiez la configuration de l\'API.');
    }
    
    // Filtrer les opportunités ouvertes
    const openOpportunities = opportunities.filter((opp: any) => {
      const state = opp.state || opp.status || '';
      // Selon la documentation, les états peuvent varier
      return !state || ['En Cours', 'Piste Identifiée', 'Open', 'Active', 'Ouvert'].includes(state);
    });
    
    console.log(`🔍 Filtered ${opportunities.length} items to ${openOpportunities.length} open opportunities`);
    
    // Mapper selon la structure attendue
    const mappedNeeds = openOpportunities.slice(0, 20).map((opportunity: any, index: number) => {
      return {
        id: opportunity.id?.toString() || opportunity.uuid || `opp-${Date.now()}-${index}`,
        title: opportunity.title || opportunity.name || opportunity.subject || opportunity.label || `Opportunité ${index + 1}`,
        client: opportunity.company?.name || opportunity.client?.name || opportunity.account?.name || opportunity.customer || 'Client non spécifié',
        description: opportunity.description || opportunity.details || opportunity.comment || opportunity.notes || '',
        status: opportunity.state || opportunity.status || 'En Cours',
        created_at: opportunity.createdAt || opportunity.created_at || opportunity.dateCreated || new Date().toISOString(),
        updated_at: opportunity.updatedAt || opportunity.updated_at || opportunity.dateUpdated || new Date().toISOString()
      };
    });
    
    console.log(`✅ Successfully mapped ${mappedNeeds.length} needs`);
    return mappedNeeds;
  } catch (error) {
    console.error('💥 Failed to fetch opportunities from Boondmanager:', error);
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
    
    // Test simple avec l'endpoint de base
    await callBoondmanagerAPI('/opportunities?limit=1', config);
    console.log('✅ Connection test successful');
    return true;
  } catch (error) {
    console.error('💥 Boondmanager connection test failed:', error);
    return false;
  }
}

/**
 * Récupère les informations d'une opportunité spécifique
 */
export async function fetchNeedDetails(needId: string): Promise<BoondmanagerNeed | null> {
  try {
    console.log(`🔍 Fetching details for opportunity: ${needId}`);
    
    const config = getBoondmanagerConfig();
    if (!config) {
      return null;
    }
    
    const response = await callBoondmanagerAPI(`/opportunities/${needId}`, config);
    const opportunity = response.data || response;
    
    if (!opportunity || !opportunity.id) {
      console.error('❌ No details found for opportunity:', needId);
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
    console.error('💥 Failed to fetch opportunity details:', error);
    return null;
  }
}