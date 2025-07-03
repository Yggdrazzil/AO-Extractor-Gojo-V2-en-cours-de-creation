/**
 * Service pour l'intégration avec l'API Boondmanager
 * Utilise la méthode X-Jwt-Client-BoondManager via Edge Function proxy
 */

import { supabase } from '../lib/supabase';

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
 */
function getBoondmanagerConfig(): BoondmanagerApiConfig | null {
  // Essayer d'abord les clés spécifiques à l'utilisateur
  let clientToken = localStorage.getItem('boondmanager-client-token');
  let clientKey = localStorage.getItem('boondmanager-client-key');
  let userToken = localStorage.getItem('boondmanager-user-token');

  // Si pas trouvé, essayer les clés utilisateur spécifiques
  if (!clientToken || !clientKey || !userToken) {
    try {
      const { data: { session } } = supabase.auth.getSession();
      const userEmail = session?.user?.email;
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
    hasUserToken: !!userToken
  });

  if (!clientToken || !clientKey || !userToken) {
    console.error('❌ Configuration Boondmanager incomplète');
    return null;
  }

  return {
    clientToken: clientToken.trim(),
    clientKey: clientKey.trim(),
    userToken: userToken.trim()
  };
}

/**
 * Effectue un appel à l'API Boondmanager via Edge Function proxy
 */
async function callBoondmanagerAPI(endpoint: string): Promise<any> {
  const config = getBoondmanagerConfig();
  
  if (!config) {
    throw new Error('Configuration Boondmanager manquante. Veuillez configurer le Client Token, Client Key et User Token dans les paramètres.');
  }

  console.log('🔗 Calling Boondmanager API via proxy:', endpoint);
  
  try {
    // Vérifier d'abord si la fonction existe
    console.log('📡 Invoking boondmanager-proxy function...');
    
    const { data, error } = await supabase.functions.invoke('boondmanager-proxy', {
      body: {
        endpoint,
        config
      }
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
      
      // Si la fonction n'existe pas, donner des instructions claires
      if (error.message?.includes('Function not found') || error.message?.includes('404')) {
        throw new Error('La fonction proxy Boondmanager n\'est pas encore déployée. Contactez l\'administrateur pour déployer la fonction Edge.');
      }
      
      throw new Error(`Erreur du proxy Supabase: ${error.message}`);
    }

    if (!data?.success) {
      console.error('❌ API call failed:', data);
      throw new Error(data?.error || 'Erreur lors de l\'appel à l\'API Boondmanager');
    }

    console.log('✅ Boondmanager API call successful via proxy');
    return data.data;
  } catch (error) {
    console.error('💥 Erreur lors de l\'appel à l\'API Boondmanager:', error);
    
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
      throw lastError || new Error('Aucun endpoint valide trouvé. Vérifiez votre configuration Boondmanager.');
    }
    
    // Filtrer côté client si nécessaire
    const filteredOpportunities = opportunities.filter((opp: any) => {
      const state = opp.state || opp.status || '';
      return !state || state === 'En Cours' || state === 'Piste Identifiée' || state === 'Open' || state === 'Active';
    });
    
    console.log(`🔍 Filtered ${opportunities.length} items to ${filteredOpportunities.length} open needs`);
    
    const mappedNeeds = filteredOpportunities.map((opportunity: any, index: number) => {
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
    
    // Mode démo temporaire
    console.log('🔧 Mode démo - Fonction proxy non déployée');
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