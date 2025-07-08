import { corsHeaders } from '../_shared/cors.ts'

/**
 * Edge function pour vérifier l'état de santé du serveur
 * Utile pour tester les fonctions Edge et la connexion à Supabase
 */
Deno.serve(async (req) => {
  // Gestion des requêtes OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const envVars = {
      supabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      supabaseAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
      supabaseServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      sendgridApiKey: !!Deno.env.get('SENDGRID_API_KEY')
    }

    return new Response(
      JSON.stringify({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        env: envVars,
        message: 'Les fonctions Edge sont opérationnelles'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})