/**
 * Service pour l'intégration avec l'API Boondmanager
 * Authentification Basic spécifique pour Hito (customerCode=hito)
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
    usernamePreview: username ? username.substring(0, 8) + '...' : 'none'
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
 * URLs spécifiques pour Hito (customerCode=hito)
 */
function getHitoApiUrls(config: BoondmanagerApiConfig): string[] {
  const urls: string[] = [];
  
  // 1. URL personnalisée si fournie
  if (config.baseUrl) {
    const customUrl = config.baseUrl.replace(/\/$/, '');
    urls.push(`${customUrl}/api`);
    urls.push(customUrl);
  }
  
  // 2. URLs spécifiques pour Hito
  urls.push(
    // API standard avec customer code
    'https://api.boondmanager.com/hito',
    'https://api.boondmanager.com',
    
    // Sous-domaine Hito
    'https://hito.boondmanager.com/api',
    'https://hito.boondmanager.com',
    
    // Autres variants possibles
    'https://api.hito.boondmanager.com',
    'https://hito-api.boondmanager.com'
  );
  
  return [...new Set(urls)]; // Supprimer les doublons
}

/**
 * Test une URL spécifique avec différents endpoints
 */
async function testApiUrl(baseUrl: string, config: BoondmanagerApiConfig): Promise<{ success: boolean; workingEndpoint?: string }> {
  const credentials = btoa(`${config.username}:${config.password}`);
  
  // Endpoints à tester dans l'ordre de priorité
  const endpointsToTest = [
    '/opportunities?limit=1',
    '/opportunity?limit=1', 
    '/projects?limit=1',
    '/needs?limit=1',
    '/api/opportunities?limit=1',
    '/api/opportunity?limit=1'
  ];
  
  // Paramètres à essayer (pour Hito)
  const customerParams = [
    '?customerCode=hito',
    '?customer=hito',
    '?client=hito',
    ''
  ];
  
  for (const endpoint of endpointsToTest) {
    for (const customerParam of customerParams) {
      const finalEndpoint = endpoint + (endpoint.includes('?') ? '&' : '') + customerParam;
      const url = `${baseUrl}${finalEndpoint}`;
      
      try {
        console.log(`🧪 Testing: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${credentials}`,
            'User-Agent': 'Hito-API-Client/1.0'
          },
          mode: 'cors',
          credentials: 'omit'
        });

        console.log(`📊 ${url} → Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ SUCCESS! Working URL: ${baseUrl}, Endpoint: ${finalEndpoint}`);
          console.log(`📋 Response preview:`, {
            type: typeof data,
            isArray: Array.isArray(data),
            keys: data && typeof data === 'object' ? Object.keys(data).slice(0, 5) : []
          });
          
          // Sauvegarder la configuration qui fonctionne
          localStorage.setItem('boondmanager-working-url', baseUrl);
          localStorage.setItem('boondmanager-working-endpoint', finalEndpoint);
          
          return { success: true, workingEndpoint: finalEndpoint };
        }
        
      } catch (error) {
        console.log(`❌ ${url} → ${error.message}`);
        continue;
      }
    }
  }
  
  return { success: false };
}

/**
 * Trouve l'URL API qui fonctionne pour Hito
 */
async function findWorkingApiUrl(config: BoondmanagerApiConfig): Promise<{ baseUrl: string; endpoint: string } | null> {
  // Vérifier d'abord s'il y a une URL qui fonctionnait déjà
  const savedUrl = localStorage.getItem('boondmanager-working-url');
  const savedEndpoint = localStorage.getItem('boondmanager-working-endpoint');
  
  if (savedUrl && savedEndpoint) {
    console.log(`🔄 Testing saved configuration: ${savedUrl}${savedEndpoint}`);
    const result = await testApiUrl(savedUrl, config);
    if (result.success) {
      return { baseUrl: savedUrl, endpoint: savedEndpoint };
    }
  }
  
  // Tester toutes les URLs possibles pour Hito
  const possibleUrls = getHitoApiUrls(config);
  console.log(`🔍 Testing ${possibleUrls.length} possible URLs for Hito...`);
  
  for (const url of possibleUrls) {
    const result = await testApiUrl(url, config);
    if (result.success && result.workingEndpoint) {
      return { baseUrl: url, endpoint: result.workingEndpoint };
    }
  }
  
  return null;
}

/**
 * Effectue un appel à l'API Boondmanager
 */
async function callBoondmanagerAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const config = getBoondmanagerConfig();
  
  if (!config) {
    throw new Error('❌ CONFIGURATION MANQUANTE\n\nVeuillez configurer votre email et mot de passe Boondmanager dans les paramètres ⚙️\n\n💡 Vos identifiants sont les mêmes que pour vous connecter sur https://ui.boondmanager.com');
  }

  console.log('🔍 Searching for working Hito API URL...');
  
  // Trouver l'URL qui fonctionne
  const workingConfig = await findWorkingApiUrl(config);
  
  if (!workingConfig) {
    const possibleUrls = getHitoApiUrls(config);
    throw new Error(`❌ AUCUNE URL API ACCESSIBLE POUR HITO\n\n🔍 URLs testées :\n${possibleUrls.map(url => `• ${url}`).join('\n')}\n\n💡 Vérifications :\n• ✅ Email/mot de passe dans les paramètres ⚙️\n• ✅ Même identifiants que ui.boondmanager.com\n• ✅ Votre compte a accès à l'API\n• ✅ Essayez d'ajouter une URL personnalisée\n\n🏢 Code client détecté : hito`);
  }
  
  const fullUrl = `${workingConfig.baseUrl}${endpoint}`;
  console.log(`🔗 Making API call to: ${fullUrl}`);
  
  const credentials = btoa(`${config.username}:${config.password}`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Basic ${credentials}`,
    'User-Agent': 'Hito-API-Client/1.0',
    ...((options.headers as Record<string, string>) || {})
  };

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401) {
        // Supprimer la config sauvegardée si l'auth échoue
        localStorage.removeItem('boondmanager-working-url');
        localStorage.removeItem('boondmanager-working-endpoint');
        throw new Error(`❌ AUTHENTIFICATION ÉCHOUÉE\n\nVos identifiants Hito sont incorrects.\n✅ Vérifiez votre email et mot de passe dans les paramètres ⚙️\n💡 Utilisez les mêmes que pour ui.boondmanager.com`);
      } else if (response.status === 403) {
        throw new Error(`❌ ACCÈS REFUSÉ\n\nVotre compte Hito n'a pas accès à l'API.\n💡 Contactez votre administrateur Boondmanager.`);
      } else {
        throw new Error(`❌ ERREUR API HITO (${response.status})\n\n${errorText.substring(0, 200)}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
      // Supprimer la config sauvegardée si l'URL ne fonctionne plus
      localStorage.removeItem('boondmanager-working-url');
      localStorage.removeItem('boondmanager-working-endpoint');
      throw new Error(`❌ PROBLÈME DE CONNEXION\n\nL'API Hito n'est pas accessible.\n\n🔧 Solutions :\n• Vérifiez votre connexion internet\n• Essayez une URL personnalisée dans les paramètres\n• L'API Hito pourrait être temporairement indisponible`);
    }
    throw error;
  }
}

/**
 * Récupère tous les besoins actifs pour Hito
 */
export async function fetchOpenNeeds(): Promise<BoondmanagerNeed[]> {
  try {
    console.log('🔍 Fetching Hito opportunities...');
    
    const response = await callBoondmanagerAPI(''); // Utilise l'endpoint déjà trouvé
    
    console.log('📊 Hito API Response structure:', {
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
          console.log(`📋 Found array in response: ${opportunities.length} items`);
        } else {
          console.log('⚠️ No array found in Hito response, returning empty list');
          return [];
        }
      } else {
        console.log('⚠️ Hito response is not an array or object');
        return [];
      }
    }
    
    // Mapper les données au format attendu
    const mappedNeeds = opportunities.slice(0, 20).map((item: any, index: number) => ({
      id: item.id?.toString() || item.uuid || `hito-need-${index}`,
      title: item.title || item.name || item.label || item.subject || `Besoin ${index + 1}`,
      client: item.company?.name || item.client?.name || item.account?.name || item.customer || 'Client non spécifié',
      description: item.description || item.comment || item.notes || item.details || '',
      status: item.state || item.status || 'En cours',
      created_at: item.createdAt || item.created_at || item.dateCreated || new Date().toISOString(),
      updated_at: item.updatedAt || item.updated_at || item.dateUpdated || new Date().toISOString()
    }));
    
    console.log(`✅ Successfully mapped ${mappedNeeds.length} Hito needs`);
    return mappedNeeds;
    
  } catch (error) {
    console.error('💥 Failed to fetch Hito needs:', error);
    throw error;
  }
}

/**
 * Teste la connexion à l'API Boondmanager pour Hito
 */
export async function testBoondmanagerConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing Hito Boondmanager connection...');
    
    const config = getBoondmanagerConfig();
    if (!config) {
      console.error('❌ No configuration found');
      return false;
    }
    
    // Essayer de trouver une URL qui fonctionne pour Hito
    const workingConfig = await findWorkingApiUrl(config);
    
    if (workingConfig) {
      console.log(`✅ Hito connection successful: ${workingConfig.baseUrl}`);
      return true;
    } else {
      console.log('❌ No working Hito API URL found');
      return false;
    }
  } catch (error) {
    console.error('💥 Hito connection test failed:', error);
    return false;
  }
}

/**
 * Récupère les détails d'un besoin spécifique
 */
export async function fetchNeedDetails(needId: string): Promise<BoondmanagerNeed | null> {
  try {
    const response = await callBoondmanagerAPI(`/${needId}`); // Utilisera le bon endpoint
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
    console.error('💥 Failed to fetch Hito need details:', error);
    return null;
  }
}