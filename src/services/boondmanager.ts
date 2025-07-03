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
    usernamePreview: username ? username.substring(0, 5) + '...' : 'none',
    passwordPreview: password ? '***' : 'none'
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
    throw new Error('❌ CONFIGURATION MANQUANTE\n\nVeuillez configurer votre nom d\'utilisateur et mot de passe Boondmanager dans les paramètres.\n\nUtilisez vos identifiants de connexion Boondmanager (email + mot de passe).');
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
    'X-Requested-With': 'XMLHttpRequest',
    ...((options.headers as Record<string, string>) || {})
  };

  console.log('📤 Request details:', {
    url,
    method: options.method || 'GET',
    authHeader: `Basic ${credentials.substring(0, 20)}...`,
    hasCredentials: !!credentials
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache'
    });

    console.log('📥 Response details:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Lire le contenu de la réponse
    const responseText = await response.text();
    console.log('📥 Response body preview:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));

    if (!response.ok) {
      console.error('❌ API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 500)
      });
      
      if (response.status === 401) {
        throw new Error(`❌ AUTHENTIFICATION ÉCHOUÉE (401)

Vos identifiants Boondmanager sont incorrects ou votre compte n'a pas accès à l'API.

Vérifiez :
• Votre email Boondmanager
• Votre mot de passe Boondmanager  
• Que votre compte a les droits d'accès API

Réponse serveur : ${responseText}`);
      } else if (response.status === 403) {
        throw new Error(`❌ ACCÈS REFUSÉ (403)

Votre compte n'a pas les permissions pour accéder à cette ressource.
Contactez votre administrateur Boondmanager.

Réponse serveur : ${responseText}`);
      } else if (response.status === 404) {
        throw new Error(`❌ ENDPOINT NON TROUVÉ (404)

L'endpoint ${endpoint} n'existe pas sur votre instance Boondmanager.

Réponse serveur : ${responseText}`);
      } else if (response.status === 0) {
        throw new Error(`❌ PROBLÈME CORS

L'API Boondmanager bloque les requêtes depuis le navigateur.
Contactez votre administrateur pour configurer les CORS.

Origin requis : ${window.location.origin}`);
      } else {
        throw new Error(`❌ ERREUR API (${response.status})

${response.statusText}

Réponse serveur : ${responseText}`);
      }
    }

    // Essayer de parser le JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ JSON parsed successfully:', {
        type: typeof data,
        isArray: Array.isArray(data),
        keys: typeof data === 'object' && data !== null ? Object.keys(data) : [],
        length: Array.isArray(data) ? data.length : 'N/A'
      });
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      throw new Error(`❌ RÉPONSE INVALIDE

La réponse de l'API n'est pas du JSON valide.

Réponse reçue : ${responseText.substring(0, 300)}`);
    }

    return data;
  } catch (error) {
    console.error('💥 Erreur lors de l\'appel à l\'API Boondmanager:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`❌ PROBLÈME DE CONNEXION

Causes possibles :
1. Connexion internet coupée
2. API Boondmanager indisponible
3. Problème CORS (l'API bloque les requêtes web)
4. Firewall ou proxy bloquant

URL tentée : ${url}`);
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('❌ ERREUR INCONNUE\n\nUne erreur inattendue s\'est produite.');
  }
}

/**
 * Récupère tous les besoins actifs
 */
export async function fetchOpenNeeds(): Promise<BoondmanagerNeed[]> {
  try {
    console.log('🔍 Fetching open needs from Boondmanager...');
    
    // Endpoints à essayer selon la documentation Boondmanager
    const endpointsToTry = [
      '/opportunities?limit=20',
      '/opportunities',
      '/opportunity',
      '/needs?limit=20', 
      '/needs',
      '/projects?limit=20',
      '/projects'
    ];
    
    let response;
    let opportunities = [];
    let lastError;
    
    for (const endpoint of endpointsToTry) {
      try {
        console.log(`🔄 Testing endpoint: ${endpoint}`);
        response = await callBoondmanagerAPI(endpoint);
        
        // Analyser la structure de réponse
        console.log('📊 Response analysis:', {
          type: typeof response,
          isArray: Array.isArray(response),
          keys: response && typeof response === 'object' ? Object.keys(response) : [],
          hasData: response && response.data !== undefined,
          dataType: response && response.data ? typeof response.data : 'undefined'
        });
        
        // Extraire les données selon différentes structures possibles
        opportunities = response?.data || response?.opportunities || response?.needs || response?.projects || response;
        
        if (Array.isArray(opportunities) && opportunities.length >= 0) {
          console.log(`✅ Success with ${endpoint}: found ${opportunities.length} items`);
          break;
        } else if (opportunities && typeof opportunities === 'object') {
          // Chercher un tableau dans les propriétés
          const arrayProperties = Object.values(opportunities).filter(Array.isArray);
          if (arrayProperties.length > 0) {
            opportunities = arrayProperties[0];
            console.log(`✅ Success with ${endpoint}: found nested array with ${opportunities.length} items`);
            break;
          }
        }
        
        console.log(`⚠️ ${endpoint} returned non-array data`);
      } catch (error) {
        console.log(`❌ ${endpoint} failed:`, error.message.split('\n')[0]);
        lastError = error;
        continue;
      }
    }
    
    if (!Array.isArray(opportunities)) {
      console.error('❌ No valid data found');
      throw lastError || new Error(`❌ AUCUNE DONNÉE TROUVÉE

Aucun endpoint n'a retourné de données exploitables.

Vérifiez :
• Votre configuration Boondmanager
• Que votre compte a accès aux données
• Que des opportunités/besoins existent dans votre instance`);
    }
    
    // Afficher un exemple pour debug
    if (opportunities.length > 0) {
      console.log('📋 Example item structure:', opportunities[0]);
    }
    
    // Mapper les données au format attendu
    const mappedNeeds = opportunities.map((item: any, index: number) => {
      const mapped = {
        id: item.id?.toString() || item.uuid || item.ref || `item-${index}`,
        title: item.title || item.name || item.subject || item.label || item.designation || `Besoin ${index + 1}`,
        client: item.company?.name || item.client?.name || item.account?.name || item.customer?.name || item.companyName || 'Client non spécifié',
        description: item.description || item.details || item.comment || item.notes || item.summary || '',
        status: item.state || item.status || item.statut || 'En cours',
        created_at: item.createdAt || item.created_at || item.dateCreated || item.createDate || new Date().toISOString(),
        updated_at: item.updatedAt || item.updated_at || item.dateUpdated || item.updateDate || new Date().toISOString()
      };
      
      return mapped;
    });
    
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
    
    console.log('🧪 Testing with credentials:', {
      hasCredentials: !!(config.username && config.password),
      username: config.username
    });
    
    // Test simple avec l'endpoint le plus basique
    const testEndpoints = [
      '/opportunities?limit=1',
      '/opportunities',
      '/needs?limit=1',
      '/needs'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`🧪 Testing: ${endpoint}`);
        await callBoondmanagerAPI(endpoint);
        console.log(`✅ Connection successful with ${endpoint}`);
        return true;
      } catch (error) {
        console.log(`❌ Test failed for ${endpoint}:`, error.message.split('\n')[0]);
        
        // Si c'est un problème CORS ou de réseau, arrêter les tests
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
          console.error('❌ Network/CORS issue detected');
          return false;
        }
        
        continue;
      }
    }
    
    console.error('❌ All connection tests failed');
    return false;
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
    console.log(`🔍 Fetching details for need: ${needId}`);
    
    const detailEndpoints = [
      `/opportunities/${needId}`,
      `/needs/${needId}`,
      `/projects/${needId}`
    ];
    
    for (const endpoint of detailEndpoints) {
      try {
        console.log(`🔄 Trying: ${endpoint}`);
        const response = await callBoondmanagerAPI(endpoint);
        const opportunity = response.data || response;
        
        if (opportunity && opportunity.id) {
          console.log(`✅ Found details with ${endpoint}`);
          return {
            id: opportunity.id?.toString() || opportunity.uuid,
            title: opportunity.title || opportunity.name || 'Titre non spécifié',
            client: opportunity.company?.name || opportunity.client?.name || 'Client non spécifié',
            description: opportunity.description || opportunity.details || '',
            status: opportunity.state || opportunity.status || 'En cours',
            created_at: opportunity.createdAt || opportunity.created_at || new Date().toISOString(),
            updated_at: opportunity.updatedAt || opportunity.updated_at || new Date().toISOString()
          };
        }
      } catch (error) {
        console.log(`❌ ${endpoint} failed:`, error.message.split('\n')[0]);
        continue;
      }
    }
    
    console.error('❌ No details found for need:', needId);
    return null;
  } catch (error) {
    console.error('💥 Failed to fetch need details:', error);
    return null;
  }
}