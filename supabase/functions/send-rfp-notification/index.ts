import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface EmailSystemTest {
  component: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

/**
 * Fonction de diagnostic complète du système d'email
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

  const tests: EmailSystemTest[] = []
  
  try {
    console.log('🔍 Starting comprehensive email system diagnosis...')
    
    // Test 1: Variables d'environnement
    console.log('📋 Test 1: Environment variables')
    const envVars = {
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      SENDGRID_API_KEY: !!Deno.env.get('SENDGRID_API_KEY'),
      PLATFORM_URL: !!Deno.env.get('PLATFORM_URL')
    }
    
    const missingEnvVars = Object.entries(envVars)
      .filter(([_, exists]) => !exists)
      .map(([name, _]) => name)
    
    if (missingEnvVars.length === 0) {
      tests.push({
        component: 'Environment Variables',
        status: 'success',
        message: 'All required environment variables are configured',
        details: {
          supabase_url_length: Deno.env.get('SUPABASE_URL')?.length || 0,
          sendgrid_key_prefix: Deno.env.get('SENDGRID_API_KEY')?.substring(0, 8) || 'none',
          platform_url: Deno.env.get('PLATFORM_URL') || 'default'
        }
      })
    } else {
      tests.push({
        component: 'Environment Variables',
        status: 'error',
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
        details: { missing: missingEnvVars, available: envVars }
      })
    }
    
    // Test 2: Connexion Supabase
    console.log('🔗 Test 2: Supabase connection')
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      const { data: salesRepsCount, error: dbError } = await supabase
        .from('sales_reps')
        .select('count', { count: 'exact' })
      
      if (dbError) {
        tests.push({
          component: 'Supabase Database',
          status: 'error',
          message: `Database connection failed: ${dbError.message}`,
          details: dbError
        })
      } else {
        tests.push({
          component: 'Supabase Database',
          status: 'success',
          message: `Database connection successful`,
          details: { sales_reps_count: salesRepsCount }
        })
      }
    } catch (dbError) {
      tests.push({
        component: 'Supabase Database',
        status: 'error',
        message: `Database connection error: ${dbError.message}`,
        details: dbError
      })
    }
    
    // Test 3: SendGrid API Test
    console.log('📧 Test 3: SendGrid API')
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    
    if (!sendGridApiKey) {
      tests.push({
        component: 'SendGrid API',
        status: 'error',
        message: 'SENDGRID_API_KEY environment variable not configured',
        details: { note: 'This is required for sending emails' }
      })
    } else {
      try {
        // Test simple de connexion à l'API SendGrid sans envoyer d'email
        const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sendGridApiKey}`,
            'Content-Type': 'application/json',
          }
        })
        
        if (response.ok) {
          const profile = await response.json()
          tests.push({
            component: 'SendGrid API',
            status: 'success',
            message: 'SendGrid API connection successful',
            details: { 
              email: profile.email || 'unknown',
              first_name: profile.first_name || 'unknown',
              api_key_prefix: sendGridApiKey.substring(0, 8)
            }
          })
        } else {
          const errorText = await response.text()
          tests.push({
            component: 'SendGrid API',
            status: 'error',
            message: `SendGrid API authentication failed: ${response.status}`,
            details: { 
              status: response.status, 
              response: errorText,
              api_key_prefix: sendGridApiKey.substring(0, 8)
            }
          })
        }
      } catch (sendGridError) {
        tests.push({
          component: 'SendGrid API',
          status: 'error',
          message: `SendGrid API connection error: ${sendGridError.message}`,
          details: sendGridError
        })
      }
    }
    
    // Test 4: Test d'envoi d'email simple
    console.log('📬 Test 4: Simple email sending test')
    if (sendGridApiKey) {
      try {
        // Récupérer un commercial pour le test
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        const { data: testSalesRep, error: salesRepError } = await supabase
          .from('sales_reps')
          .select('email, name, code')
          .limit(1)
          .single()
        
        if (salesRepError || !testSalesRep) {
          tests.push({
            component: 'Email Test',
            status: 'warning',
            message: 'Cannot test email sending: no sales rep found for testing',
            details: salesRepError
          })
        } else {
          // Envoyer un email de test simple
          const testResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sendGridApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [
                {
                  to: [{ email: testSalesRep.email }],
                  subject: `[TEST] Diagnostic système GOJO - ${new Date().toLocaleTimeString('fr-FR')}`
                }
              ],
              from: {
                email: 'notifications@hito.digital',
                name: 'GOJO Test'
              },
              content: [
                {
                  type: 'text/plain',
                  value: `Test du système d'envoi d'emails GOJO\n\nBonjour ${testSalesRep.name},\n\nCe message confirme que le système d'envoi d'emails fonctionne correctement.\n\nDiagnostic effectué le ${new Date().toLocaleString('fr-FR')}\n\nGOJO - Système de test automatique`
                },
                {
                  type: 'text/html',
                  value: `
                    <h2>Test du système GOJO</h2>
                    <p>Bonjour <strong>${testSalesRep.name}</strong>,</p>
                    <p>Ce message confirme que le système d'envoi d'emails fonctionne correctement.</p>
                    <p><em>Diagnostic effectué le ${new Date().toLocaleString('fr-FR')}</em></p>
                    <hr>
                    <small>GOJO - Système de test automatique</small>
                  `
                }
              ]
            }),
          })
          
          const responseText = await testResponse.text()
          
          if (testResponse.ok) {
            const messageId = testResponse.headers.get('X-Message-Id') || 'unknown'
            tests.push({
              component: 'Email Test',
              status: 'success',
              message: `Test email sent successfully to ${testSalesRep.email}`,
              details: { 
                message_id: messageId,
                recipient: testSalesRep.email,
                sales_rep: testSalesRep.code
              }
            })
          } else {
            tests.push({
              component: 'Email Test',
              status: 'error',
              message: `Test email failed: ${testResponse.status}`,
              details: { 
                status: testResponse.status, 
                response: responseText,
                recipient: testSalesRep.email
              }
            })
          }
        }
      } catch (emailTestError) {
        tests.push({
          component: 'Email Test',
          status: 'error',
          message: `Email test error: ${emailTestError.message}`,
          details: emailTestError
        })
      }
    }
    
    // Test 5: Test des fonctions Edge
    console.log('⚡ Test 5: Edge Functions availability')
    try {
      // Tester si les fonctions Edge sont déployées
      const edgeFunctions = ['send-rfp-notification', 'send-prospect-notification', 'send-client-need-notification']
      
      for (const funcName of edgeFunctions) {
        try {
          const testUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${funcName}`
          const funcResponse = await fetch(testUrl, {
            method: 'OPTIONS',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            }
          })
          
          if (funcResponse.ok || funcResponse.status === 405) {
            tests.push({
              component: `Edge Function: ${funcName}`,
              status: 'success',
              message: `Function is deployed and accessible`,
              details: { status: funcResponse.status }
            })
          } else {
            tests.push({
              component: `Edge Function: ${funcName}`,
              status: 'error',
              message: `Function not accessible: ${funcResponse.status}`,
              details: { status: funcResponse.status }
            })
          }
        } catch (funcError) {
          tests.push({
            component: `Edge Function: ${funcName}`,
            status: 'error',
            message: `Function test error: ${funcError.message}`,
            details: funcError
          })
        }
      }
    } catch (edgeError) {
      tests.push({
        component: 'Edge Functions',
        status: 'error',
        message: `Edge functions test error: ${edgeError.message}`,
        details: edgeError
      })
    }
    
    // Résumé du diagnostic
    const hasErrors = tests.some(test => test.status === 'error')
    const hasWarnings = tests.some(test => test.status === 'warning')
    
    const overallStatus = hasErrors ? 'error' : hasWarnings ? 'warning' : 'success'
    const overallMessage = hasErrors 
      ? 'Email system has critical issues that need attention'
      : hasWarnings 
      ? 'Email system is mostly functional but has some warnings'
      : 'Email system is fully operational'
    
    return new Response(
      JSON.stringify({ 
        success: overallStatus === 'success',
        status: overallStatus,
        message: overallMessage,
        timestamp: new Date().toISOString(),
        tests: tests,
        summary: {
          total_tests: tests.length,
          success_count: tests.filter(t => t.status === 'success').length,
          warning_count: tests.filter(t => t.status === 'warning').length,
          error_count: tests.filter(t => t.status === 'error').length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Fatal error in email system diagnosis:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        status: 'error',
        message: 'Fatal error during email system diagnosis',
        timestamp: new Date().toISOString(),
        error: error.message || 'Unknown error occurred',
        tests: tests // Retourner les tests déjà effectués
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})