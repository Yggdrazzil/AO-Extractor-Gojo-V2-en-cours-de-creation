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
    usernamePreview: username ? username.substring(0, 8) + '...' : 'none',
    baseUrlPreview: baseUrl || 'none'
  });

  if (!username || !password) {
    console.error('❌ Configuration Boondmanager incomplète');
    return null;
  }

  return {
    username: username.trim(),
    password: password.trim(),
    baseUrl: baseUrl?.trim()
  };
}

/**
 * Détermine les URLs possibles pour l'API
 */
function getPossibleApiUrls(config: BoondmanagerApiConfig): string[] {
  const urls: string[] = [];
  
  // 1. URL personnalisée si fournie
  if (config.baseUrl) {
    const customUrl = config.baseUrl.replace(/\/$/, ''); // Supprimer / final
    urls.push(`${customUrl}/api`);
    urls.push(customUrl);
  }
  
  // 2. Déduction depuis l'email si c'est un domaine personnalisé
  if (config.username.includes('@') && !config.username.includes('@boondmanager.com')) {
    const domain = config.username.split('@')[1];
    // Essayer différents formats pour les domaines personnalisés
    urls.push(`https://${domain}/api`);
    urls.push(`https://app.${domain}/api`);
    urls.push(`https://${domain.replace('.', '-')}.boondmanager.com/api`);
  }
  
  // 3. URLs standards connues (rarement accessibles directement)
  urls.push(
    'https://app.boondmanager.com/api',
    'https://api.boondmanager.com',
    'https://www.boondmanager.com/api'
  );
  
  return [...new Set(urls)]; // Supprimer les doublons
}

/**
 * Test une URL spécifique
 */
async function testApiUrl(url: string, config: BoondmanagerApiConfig): Promise<boolean> {
  try {
    console.log(`🧪 Testing: ${url}`);
    
    const credentials = btoa(`${config.username}:${config.password}`);
    
    const response = await fetch(`${url}/opportunities?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      mode: 'cors',
      credentials: 'omit'
    });

    console.log(`📊 ${url} → Status: ${response.status}`);
    
    if (response.ok) {
      // Sauvegarder l'URL qui fonctionne
      localStorage.setItem('boondmanager-working-url', url);
      console.log(`✅ Working URL found: ${url}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`❌ ${url} → ${error.message}`);
    return false;
  }
}

/**
 * Trouve l'URL API qui fonctionne
 */
async function findWorkingApiUrl(config: BoondmanagerApiConfig): Promise<string | null> {
  // Vérifier d'abord s'il y a une URL qui fonctionnait déjà
  const savedUrl = localStorage.getItem('boondmanager-working-url');
  if (savedUrl) {
    const works = await testApiUrl(savedUrl, config);
    if (works) return savedUrl;
  }
  
  // Tester toutes les URLs possibles
  const possibleUrls = getPossibleApiUrls(config);
  
  for (const url of possibleUrls) {
    const works = await testApiUrl(url, config);
    if (works) return url;
  }
  
  return null;
}

/**
 * Effectue un appel à l'API Boondmanager
 */
async function callBoondmanagerAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const config = getBoondmanagerConfig();
  
  if (!config) {
    throw new Error('❌ CONFIGURATION MANQUANTE\n\nVeuillez configurer votre nom d\'utilisateur et mot de passe Boondmanager dans les paramètres.\n\n💡 Astuce : Si vous avez un domaine personnalisé, ajoutez aussi l\'URL de base.');
  }

  // Trouver l'URL qui fonctionne
  const workingUrl = await findWorkingApiUrl(config);
  
  if (!workingUrl) {
    throw new Error(`❌ AUCUNE URL API ACCESSIBLE\n\nAucune URL ne répond avec vos identifiants.\n\n🔍 URLs testées :\n${getPossibleApiUrls(config).map(url => `• ${url}`).join('\n')}\n\n💡 Vérifiez :\n• Vos identifiants dans les paramètres\n• L'URL de votre instance Boondmanager\n• Que votre compte a accès à l'API`);
  }
  
  const url = `${workingUrl}${endpoint}`;
  console.log(`🔗 Calling: ${url}`);
  
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

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401) {
        throw new Error(`❌ AUTHENTIFICATION ÉCHOUÉE\n\nVos identifiants sont incorrects.\nVérifiez votre email et mot de passe dans les paramètres.`);
      } else if (response.status === 403) {
        throw new Error(`❌ ACCÈS REFUSÉ\n\nVotre compte n'a pas les permissions API.\nContactez votre administrateur Boondmanager.`);
      } else {
        throw new Error(`❌ ERREUR API (${response.status})\n\n${errorText.substring(0, 200)}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
      throw new Error(`❌ PROBLÈME DE CONNEXION\n\nL'URL ${workingUrl} n'est pas accessible.\n\n💡 Vérifiez l'URL de votre instance Boondmanager dans les paramètres.`);
    }
    throw error;
  }
}

/**
 * Récupère tous les besoins actifs
 */
export async function fetchOpenNeeds(): Promise<BoondmanagerNeed[]> {
  try {
    console.log('🔍 Fetching open needs from Boondmanager...');
    
    const response = await callBoondmanagerAPI('/opportunities?limit=20');
    
    console.log('📊 Response structure:', {
      type: typeof response,
      isArray: Array.isArray(response),
      keys: response && typeof response === 'object' ? Object.keys(response) : []
    });
    
    // Extraire les données selon différents formats possibles
    let opportunities = response?.data || response?.opportunities || response?.results || response;
    
    if (!Array.isArray(opportunities)) {
      // Si c'est un objet, chercher un tableau à l'intérieur
      if (response && typeof response === 'object') {
        const possibleArrays = Object.values(response).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          opportunities = possibleArrays[0];
        } else {
          console.log('⚠️ No array found in response, returning empty list');
          return [];
        }
      } else {
        console.log('⚠️ Response is not an array or object');
        return [];
      }
    }
    
    // Mapper les données au format attendu
    const mappedNeeds = opportunities.slice(0, 20).map((item: any, index: number) => ({
      id: item.id?.toString() || item.uuid || `need-${index}`,
      title: item.title || item.name || item.label || `Besoin ${index + 1}`,
      client: item.company?.name || item.client?.name || item.account?.name || 'Client non spécifié',
      description: item.description || item.comment || item.notes || '',
      status: item.state || item.status || 'En cours',
      created_at: item.createdAt || item.created_at || item.dateCreated || new Date().toISOString(),
      updated_at: item.updatedAt || item.updated_at || item.dateUpdated || new Date().toISOString()
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
    
    // Essayer de trouver une URL qui fonctionne
    const workingUrl = await findWorkingApiUrl(config);
    return !!workingUrl;
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