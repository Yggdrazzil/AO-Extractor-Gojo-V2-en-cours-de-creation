const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface BoondmanagerConfig {
  clientToken: string
  clientKey: string
  userToken: string
}

/**
 * Fonction Edge pour contourner les problèmes CORS avec l'API Boondmanager
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

    const { clientToken, clientKey, userToken } = config as BoondmanagerConfig
    
    if (!clientToken || !clientKey || !userToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required tokens' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Construire le JWT selon la documentation Boondmanager
    const jwtToken = `${clientToken}.${clientKey}.${userToken}`
    
    // URL de base de l'API Boondmanager
    const baseUrl = 'https://api.boondmanager.com'
    const url = `${baseUrl}${endpoint}`
    
    console.log(`📤 Calling Boondmanager API: ${url}`)
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Jwt-Client-BoondManager': jwtToken,
      'User-Agent': 'Supabase-Edge-Function/1.0'
    }

    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    console.log(`📥 Response status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error Response: ${errorText}`)
      
      let errorMessage = `Erreur API Boondmanager (${response.status})`
      
      if (response.status === 401) {
        errorMessage = 'Authentification échouée. Vérifiez vos tokens Boondmanager'
      } else if (response.status === 403) {
        errorMessage = 'Accès refusé. Vérifiez les permissions de votre User Token'
      } else if (response.status === 404) {
        errorMessage = 'Endpoint non trouvé'
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText,
          status: response.status
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    console.log('✅ API Response received')
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})