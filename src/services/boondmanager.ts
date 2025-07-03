/**
 * Service pour l'intégration avec l'API Boondmanager
 * Version de debug avec logs détaillés
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
}

/**
 * Configuration de l'API Boondmanager
 */
function getBoondmanagerConfig(): BoondmanagerApiConfig | null {
  // Essayer d'abord les clés spécifiques à l'utilisateur
  let username = localStorage.getItem('boondmanager-username');
  let password = localStorage.getItem('boondmanager-password');

  // Si pas trouvé, essayer les clés utilisateur spécifiques
  if (!username || !password) {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email;
      
      if (userEmail) {
        const userPrefix = `boondmanager_${userEmail}_`;
        username = username || localStorage.getItem(`${userPrefix}username`);
        password = password || localStorage.getItem(`${userPrefix}password`);
      }
    } catch (e) {
      console.warn('Could not get user-specific config:', e);
    }
  }

  console.log('🔧 Boondmanager config check:', { 
    hasUsername: !!username,
    hasPassword: !!password,
    usernameLength: username?.length || 0,
    passwordLength: password?.length || 0
  });

  if (!username || !password) {
    console.error('❌ Configuration Boondmanager incomplète');
    return null;
  }

  return {
    username: username.trim(),
    password: password.trim()
  };
}

/**
 * Effectue un appel à l'API Boondmanager avec authentification Basic
 */
async function callBoondmanagerAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const config = getBoondmanagerConfig();
  
  if (!config) {
    throw new Error('Configuration Boondmanager manquante. Veuillez configurer votre nom d\'utilisateur et mot de passe dans les paramètres.');
  }

  // URL de base de l'API Boondmanager
  const baseUrl = 'https://api.boondmanager.com';
  const url = `${baseUrl}${endpoint}`;
  
  console.log('🔗 Calling Boondmanager API:', {
    url,
    method: options.method || 'GET',
    username: config.username,
    hasPassword: !!config.password
  });
  
  // Créer l'en-tête d'authentification Basic
  const credentials = btoa(`${config.username}:${config.password}`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Basic ${credentials}`,
    'User-Agent': 'Mozilla/5.0 (compatible; GOJO-Platform/1.0)',
    ...((options.headers as Record<string, string>) || {})
  };

  console.log('📤 Request headers:', {
    'Content-Type': headers['Content-Type'],
    'Accept': headers['Accept'],
    'Authorization': `Basic ${credentials.substring(0, 20)}...`,
    'User-Agent': headers['User-Agent']
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'omit'
    });

    console.log('📥 Response details:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    });

    // Lire le contenu de la réponse
    const responseText = await response.text();
    console.log('📥 Response body (first 500 chars):', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('❌ API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      if (response.status === 401) {
        throw new Error('❌ AUTHENTIFICATION ÉCHOUÉE\n\nVérifiez :\n• Votre nom d\'utilisateur Boondmanager\n• Votre mot de passe Boondmanager\n• Que votre compte a accès à l\'API\n\nRéponse serveur : ' + responseText);
      } else if (response.status === 403) {
        throw new Error('❌ ACCÈS REFUSÉ\n\nVotre compte n\'a pas les permissions pour accéder à l\'API Boondmanager.\nContactez votre administrateur.\n\nRéponse serveur : ' + responseText);
      } else if (response.status === 404) {
        throw new Error('❌ ENDPOINT NON TROUVÉ\n\nL\'endpoint ' + endpoint + ' n\'existe pas.\nVérifiez la documentation API Boondmanager.\n\nRéponse serveur : ' + responseText);
      } else if (response.status === 0) {
        throw new Error('❌ PROBLÈME CORS\n\nL\'API Boondmanager bloque les requêtes depuis le navigateur.\nContactez votre administrateur Boondmanager pour configurer les CORS pour : ' + window.location.origin);
      } else {
        throw new Error(`❌ ERREUR API (${response.status})\n\n${response.statusText}\n\nRéponse serveur : ${responseText}`);
      }
    }

    // Essayer de parser le JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ JSON parsed successfully, type:', typeof data, 'keys:', Object.keys(data || {}));
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      throw new Error('❌ RÉPONSE INVALIDE\n\nLa réponse de l\'API n\'est pas du JSON valide.\n\nRéponse reçue : ' + responseText.substring(0, 200));
    }

    return data;
  } catch (error) {
    console.error('💥 Erreur lors de l\'appel à l\'API Boondmanager:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('❌ PROBLÈME DE CONNEXION\n\n1. Vérifiez votre connexion internet\n2. L\'API Boondmanager pourrait être indisponible\n3. Problème CORS possible\n\nURL tentée : ' + url);
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('❌ ERREUR INCONNUE\n\nUne erreur inattendue s\'est produite lors de l\'appel à l\'API Boondmanager.');
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
      '/opportunities?limit=10',
      '/opportunities',
      '/needs?limit=10',
      '/needs',
      '/projects?limit=10',
      '/projects',
      '/api/opportunities',
      '/api/needs',
      '/v1/opportunities',
      '/v1/needs'
    ];
    
    let response;
    let opportunities;
    let lastError;
    
    for (const endpoint of endpointsToTry) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        response = await callBoondmanagerAPI(endpoint);
        
        console.log('📊 Response structure:', {
          type: typeof response,
          isArray: Array.isArray(response),
          keys: response && typeof response === 'object' ? Object.keys(response) : [],
          length: Array.isArray(response) ? response.length : 'N/A'
        });
        
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
      throw lastError || new Error('❌ AUCUN ENDPOINT VALIDE\n\nAucun endpoint n\'a retourné de données valides.\nVérifiez :\n• Votre configuration Boondmanager\n• Que votre compte a accès aux données\n• La documentation API de votre instance');
    }
    
    // Afficher un exemple d'opportunité pour debug
    if (opportunities.length > 0) {
      console.log('📋 Example opportunity structure:', opportunities[0]);
    }
    
    // Filtrer côté client si nécessaire
    const filteredOpportunities = opportunities.filter((opp: any) => {
      const state = opp.state || opp.status || '';
      return !state || state === 'En Cours' || state === 'Piste Identifiée' || state === 'Open' || state === 'Active';
    });
    
    console.log(`🔍 Filtered ${opportunities.length} items to ${filteredOpportunities.length} open needs`);
    
    const mappedNeeds = filteredOpportunities.map((opportunity: any, index: number) => {
      const mapped = {
        id: opportunity.id?.toString() || opportunity.uuid || `temp-${Date.now()}-${index}`,
        title: opportunity.title || opportunity.name || opportunity.subject || opportunity.label || `Besoin ${index + 1}`,
        client: opportunity.company?.name || opportunity.client?.name || opportunity.account?.name || opportunity.customer || 'Client non spécifié',
        description: opportunity.description || opportunity.details || opportunity.comment || opportunity.notes || '',
        status: opportunity.state || opportunity.status || 'En Cours',
        created_at: opportunity.createdAt || opportunity.created_at || opportunity.dateCreated || new Date().toISOString(),
        updated_at: opportunity.updatedAt || opportunity.updated_at || opportunity.dateUpdated || new Date().toISOString()
      };
      
      console.log(`📝 Mapped opportunity ${index}:`, mapped);
      return mapped;
    });
    
    console.log(`✅ Successfully mapped ${mappedNeeds.length} needs`);
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
      hasCredentials: !!(config.username && config.password),
      username: config.username
    });
    
    // Essayer plusieurs endpoints pour tester la connexion
    const testEndpoints = [
      '/opportunities?limit=1',
      '/opportunities',
      '/needs?limit=1', 
      '/needs',
      '/projects?limit=1',
      '/projects',
      '/api/opportunities',
      '/v1/opportunities'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`🧪 Testing endpoint: https://api.boondmanager.com${endpoint}`);
        const result = await callBoondmanagerAPI(endpoint);
        console.log(`✅ Connection test successful with ${endpoint}`, typeof result);
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
      `/projects/${needId}`,
      `/api/opportunities/${needId}`,
      `/v1/opportunities/${needId}`
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