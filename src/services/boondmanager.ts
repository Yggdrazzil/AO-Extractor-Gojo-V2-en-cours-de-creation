/**
 * Service pour l'intégration avec l'API Boondmanager
 * Utilise la fonction Edge pour contourner les problèmes CORS
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
  baseUrl?: string;
}

/**
 * Configuration de l'API Boondmanager
 */
function getBoondmanagerConfig(): BoondmanagerApiConfig | null {
  // Essayer d'abord les clés globales
  let username = localStorage.getItem('boondmanager-username');
  let password = localStorage.getItem('boondmanager-password');
  let baseUrl = localStorage.getItem('boondmanager-base-url');

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
          baseUrl = baseUrl || localStorage.getItem(`${userPrefix}base-url`);
        }
      }
    } catch (e) {
      console.warn('Could not get user-specific config:', e);
    }
  }

  console.log('🔧 Boondmanager config check:', { 
    hasUsername: !!username,
    hasPassword: !!password,
    hasBaseUrl: !!baseUrl,
    usernamePreview: username ? username.substring(0, 8) + '...' : 'none'
  });

  if (!username || !password) {
    console.error('❌ Configuration Boondmanager incomplète');
    return null;
  }

  return {
    username: username.trim(),
    password: password.trim(),
    customerCode: 'hito', // Code client spécifique pour votre entreprise
    baseUrl: baseUrl?.trim() || undefined
  };
}

/**
 * Effectue un appel à l'API Boondmanager via la fonction Edge
 */
async function callBoondmanagerAPI(endpoint: string): Promise<any> {
  const config = getBoondmanagerConfig();
  
  if (!config) {
    throw new Error('❌ CONFIGURATION MANQUANTE\n\nVeuillez configurer votre email et mot de passe Boondmanager dans les paramètres ⚙️');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Configuration Supabase manquante');
  }

  console.log('🔗 Calling Boondmanager via Edge Function:', endpoint);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/boondmanager-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        endpoint,
        config
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Edge Function error:', errorData);
      throw new Error(errorData.error || `Erreur Edge Function (${response.status})`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur inconnue de l\'API');
    }

    console.log('✅ Edge Function response received');
    return result.data;
  } catch (error) {
    console.error('💥 Error calling Edge Function:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('❌ PROBLÈME DE CONNEXION\n\nImpossible de contacter le serveur Edge Function.\nVérifiez votre connexion internet.');
    }
    
    throw error;
  }
}

/**
 * Récupère les opportunités ouvertes
 */
export async function fetchOpenNeeds(): Promise<BoondmanagerNeed[]> {
  try {
    console.log('🔍 Fetching opportunities from Boondmanager...');
    
    // Endpoints à essayer selon la documentation
    const endpointsToTry = [
      '/opportunities',
      '/opportunities?limit=50',
      '/api/opportunities',
      '/api/opportunities?limit=50',
      '/api/v1/opportunities',
      '/api/v1/opportunities?limit=50'
    ];
    
    let opportunities;
    let lastError;
    
    for (const endpoint of endpointsToTry) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        const response = await callBoondmanagerAPI(endpoint);
        
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
      throw lastError || new Error('Aucun endpoint valide trouvé pour récupérer les opportunités.');
    }
    
    // Filtrer les opportunités ouvertes
    const openOpportunities = opportunities.filter((opp: any) => {
      const state = opp.state || opp.status || '';
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
    await callBoondmanagerAPI('/opportunities?limit=1');
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
    
    const response = await callBoondmanagerAPI(`/opportunities/${needId}`);
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