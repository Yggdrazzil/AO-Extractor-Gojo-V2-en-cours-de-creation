const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface BoondmanagerConfig {
  username: string
  password: string
  customerCode?: string
  baseUrl?: string
}

/**
 * Fonction Edge pour contourner les problèmes CORS avec l'API Boondmanager
 * Utilise l'authentification Basic Auth selon la documentation officielle
 */
Deno.serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    console.log('🔗 Boondmanager proxy request received')
    
    const { endpoint, config } = await req.json()
    
    if (!endpoint || !config) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint or config' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { username, password, customerCode, baseUrl } = config as BoondmanagerConfig
    
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing username or password' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // URL de base - essayer l'URL personnalisée d'abord, puis l'API officielle
    const apiBaseUrl = baseUrl || 'https://api.boondmanager.com'
    
    // Construire l'URL complète
    let url = `${apiBaseUrl}${endpoint}`
    
    // Ajouter le customerCode si fourni
    if (customerCode) {
      const separator = endpoint.includes('?') ? '&' : '?'
      url += `${separator}customerCode=${customerCode}`
    }
    
    console.log(`📤 Calling Boondmanager API: ${url}`)
    
    // Authentification Basic Auth selon la documentation
    const credentials = btoa(`${username}:${password}`)
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${credentials}`,
      'User-Agent': 'Hito-API-Client/1.0'
    }

    console.log('📤 Request headers:', {
      ...headers,
      'Authorization': `Basic ${username.substring(0, 4)}...`
    })

    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    console.log(`📥 Response status: ${response.status}`)
    console.log(`📥 Response headers:`, Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error Response: ${errorText}`)
      
      let errorMessage = `Erreur API Boondmanager (${response.status})`
      
      if (response.status === 401) {
        errorMessage = 'Authentification échouée. Vérifiez votre email et mot de passe Boondmanager'
      } else if (response.status === 403) {
        errorMessage = 'Accès refusé. Votre compte n\'a peut-être pas accès à l\'API'
      } else if (response.status === 404) {
        errorMessage = `Endpoint non trouvé: ${endpoint}`
      } else if (response.status === 0 || errorText.includes('CORS')) {
        errorMessage = 'Problème CORS. L\'API Boondmanager bloque les requêtes'
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText,
          status: response.status,
          url: url
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    console.log('✅ API Response received successfully')
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Function error:', error)
    
    let errorMessage = 'Erreur interne du serveur'
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Impossible de contacter l\'API Boondmanager. Vérifiez l\'URL de base.'
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})