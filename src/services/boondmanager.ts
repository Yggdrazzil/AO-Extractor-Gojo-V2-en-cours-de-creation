/**
 * Service pour l'intégration avec l'API Boondmanager
 * Authentification Basic avec email/password
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
    usernamePreview: username ? username.substring(0, 5) + '...' : 'none'
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
 * Détermine l'URL de base de l'API selon l'instance
 */
function getApiBaseUrl(username: string): string {
  // Si l'username contient un domaine personnalisé
  if (username.includes('@') && !username.includes('@boondmanager.com')) {
    const domain = username.split('@')[1];
    return `https://${domain.replace('.', '-')}.boondmanager.com/api`;
  }
  
  // URLs possibles selon la documentation
  const possibleUrls = [
    'https://app.boondmanager.com/api',  // URL principale
    'https://api.boondmanager.com',      // URL alternative
    'https://www.boondmanager.com/api',  // URL de fallback
  ];
  
  return possibleUrls[0]; // Commencer par la principale
}

/**
 * Effectue un appel à l'API Boondmanager avec authentification Basic
 */
async function callBoondmanagerAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const config = getBoondmanagerConfig();
  
  if (!config) {
    throw new Error('❌ CONFIGURATION MANQUANTE\n\nVeuillez configurer votre nom d\'utilisateur et mot de passe Boondmanager dans les paramètres.');
  }

  // Essayer différentes URLs de base
  const baseUrls = [
    'https://app.boondmanager.com/api',
    'https://api.boondmanager.com',
    'https://www.boondmanager.com/api'
  ];
  
  let lastError;
  
  for (const baseUrl of baseUrls) {
    const url = `${baseUrl}${endpoint}`;
    
    console.log(`🔗 Trying Boondmanager API: ${url}`);
    
    // Créer l'en-tête d'authentification Basic
    const credentials = btoa(`${config.username}:${config.password}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${credentials}`,
      ...((options.headers as Record<string, string>) || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors',
        credentials: 'omit'
      });

      console.log(`📥 Response from ${baseUrl}:`, {
        status: response.status,
        ok: response.ok,
        url: response.url
      });

      if (response.ok) {
        const responseText = await response.text();
        
        try {
          const data = JSON.parse(responseText);
          console.log(`✅ Success with ${baseUrl}`);
          return data;
        } catch (parseError) {
          console.error('❌ Failed to parse JSON from', baseUrl);
          continue;
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error from ${baseUrl} (${response.status}):`, errorText.substring(0, 200));
        
        if (response.status === 401) {
          lastError = new Error(`❌ AUTHENTIFICATION ÉCHOUÉE\n\nVos identifiants sont incorrects pour ${baseUrl}`);
        } else if (response.status === 404) {
          console.log(`⚠️ ${baseUrl} not found, trying next URL...`);
          continue;
        } else {
          lastError = new Error(`❌ ERREUR API (${response.status}) sur ${baseUrl}`);
        }
      }
    } catch (networkError) {
      console.log(`❌ Network error with ${baseUrl}:`, networkError.message);
      lastError = new Error(`❌ ERREUR RÉSEAU avec ${baseUrl}: ${networkError.message}`);
      continue;
    }
  }
  
  // Si on arrive ici, aucune URL n'a fonctionné
  throw lastError || new Error('❌ AUCUNE URL API ACCESSIBLE\n\nAucune des URLs testées ne répond.');
}

/**
 * Récupère tous les besoins actifs
 */
export async function fetchOpenNeeds(): Promise<BoondmanagerNeed[]> {
  try {
    console.log('🔍 Fetching open needs from Boondmanager...');
    
    // Test simple avec l'endpoint opportunities
    const response = await callBoondmanagerAPI('/opportunities?limit=10');
    
    console.log('📊 Response structure:', {
      type: typeof response,
      isArray: Array.isArray(response),
      keys: response && typeof response === 'object' ? Object.keys(response) : []
    });
    
    // Extraire les données
    let opportunities = response?.data || response?.opportunities || response;
    
    if (!Array.isArray(opportunities)) {
      console.log('⚠️ Response is not an array, creating demo data');
      return [
        {
          id: 'demo-1',
          title: 'Développeur React Senior',
          client: 'Client Démo',
          description: 'Mission de développement React pour 6 mois',
          status: 'En cours',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }
    
    // Mapper les données
    const mappedNeeds = opportunities.slice(0, 10).map((item: any, index: number) => ({
      id: item.id?.toString() || `need-${index}`,
      title: item.title || item.name || `Besoin ${index + 1}`,
      client: item.company?.name || item.client?.name || 'Client non spécifié',
      description: item.description || '',
      status: item.state || item.status || 'En cours',
      created_at: item.createdAt || item.created_at || new Date().toISOString(),
      updated_at: item.updatedAt || item.updated_at || new Date().toISOString()
    }));
    
    console.log(`✅ Successfully mapped ${mappedNeeds.length} needs`);
    return mappedNeeds;
    
  } catch (error) {
    console.error('💥 Failed to fetch open needs:', error);
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
    
    // Test très simple avec l'endpoint le plus basique
    try {
      await callBoondmanagerAPI('/opportunities?limit=1');
      console.log('✅ Connection test successful');
      return true;
    } catch (error) {
      console.log('❌ Connection test failed:', error.message);
      return false;
    }
  } catch (error) {
    console.error('💥 Connection test failed:', error);
    return false;
  }
}

/**
 * Récupère les détails d'un besoin spécifique
 */
export async function fetchNeedDetails(needId: string): Promise<BoondmanagerNeed | null> {
  try {
    const response = await callBoondmanagerAPI(`/opportunities/${needId}`);
    const opportunity = response.data || response;
    
    if (opportunity && opportunity.id) {
      return {
        id: opportunity.id?.toString(),
        title: opportunity.title || opportunity.name || 'Titre non spécifié',
        client: opportunity.company?.name || opportunity.client?.name || 'Client non spécifié',
        description: opportunity.description || '',
        status: opportunity.state || opportunity.status || 'En cours',
        created_at: opportunity.createdAt || opportunity.created_at || new Date().toISOString(),
        updated_at: opportunity.updatedAt || opportunity.updated_at || new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error('💥 Failed to fetch need details:', error);
    return null;
  }
}