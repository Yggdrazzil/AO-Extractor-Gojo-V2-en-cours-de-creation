import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RFPNotificationData {
  rfpId: string
  client: string
  mission: string
  salesRepCode: string
  assignedTo: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Génère le contenu HTML de l'email
 */
function generateEmailHTML(data: RFPNotificationData, platformUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouvel AO assigné</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 20px; 
          background-color: #f8fafc; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
          overflow: hidden; 
        }
        .header { 
          background: linear-gradient(135deg, #1651EE 0%, #4F46E5 100%); 
          color: white; 
          padding: 32px 24px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600; 
        }
        .header p { 
          margin: 8px 0 0 0; 
          opacity: 0.9; 
          font-size: 16px; 
        }
        .content { 
          padding: 32px 24px; 
        }
        .greeting { 
          font-size: 18px; 
          margin-bottom: 24px; 
        }
        .mission-card { 
          background: #f1f5f9; 
          border-left: 4px solid #1651EE; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 24px 0; 
        }
        .mission-title { 
          font-weight: 600; 
          color: #1e293b; 
          font-size: 18px; 
          margin-bottom: 8px; 
        }
        .client-name { 
          color: #64748b; 
          font-size: 16px; 
          font-weight: 500; 
        }
        .cta-section { 
          text-align: center; 
          margin: 32px 0; 
        }
        .cta-button { 
          display: inline-block; 
          background: #1651EE; 
          color: white; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px; 
          transition: background-color 0.2s; 
        }
        .cta-button:hover { 
          background: #1e40af; 
        }
        .instructions { 
          background: #fef3c7; 
          border: 1px solid #fbbf24; 
          border-radius: 8px; 
          padding: 16px; 
          margin: 24px 0; 
        }
        .instructions-title { 
          font-weight: 600; 
          color: #92400e; 
          margin-bottom: 8px; 
        }
        .instructions-text { 
          color: #92400e; 
          font-size: 14px; 
          margin: 0; 
        }
        .footer { 
          text-align: center; 
          color: #64748b; 
          font-size: 12px; 
          padding: 24px; 
          border-top: 1px solid #e2e8f0; 
          background: #f8fafc; 
        }
        .logo { 
          font-size: 20px; 
          font-weight: bold; 
          margin-bottom: 8px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🚀 HITO Digital</div>
          <h1>📋 Nouvel AO assigné</h1>
          <p>Un appel d'offres vous attend</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Bonjour <strong>${data.salesRepCode}</strong>,
          </div>
          
          <p>Un nouvel appel d'offres vient d'être analysé et vous a été assigné automatiquement :</p>
          
          <div class="mission-card">
            <div class="mission-title">${data.mission}</div>
            <div class="client-name">📍 ${data.client}</div>
          </div>
          
          <div class="instructions">
            <div class="instructions-title">⚡ Action requise</div>
            <p class="instructions-text">
              Connectez-vous à la plateforme pour consulter tous les détails de cet AO et commencer le traitement.
            </p>
          </div>
          
          <div class="cta-section">
            <a href="${platformUrl}" class="cta-button">
              🔍 Consulter l'AO
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
            <strong>Rappel :</strong> Pensez à marquer l'AO comme "lu" une fois consulté pour optimiser le suivi.
          </p>
        </div>
        
        <div class="footer">
          <div>📧 Email automatique • Ne pas répondre</div>
          <div style="margin-top: 8px;">HITO Digital - Plateforme de gestion des AO</div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Génère le contenu texte de l'email
 */
function generateEmailText(data: RFPNotificationData, platformUrl: string): string {
  return `
🚀 HITO Digital - Nouvel AO assigné

Bonjour ${data.salesRepCode},

Un nouvel appel d'offres vient d'être analysé et vous a été assigné :

📋 Mission: ${data.mission}
📍 Client: ${data.client}

⚡ Action requise:
Connectez-vous à la plateforme pour consulter tous les détails et commencer le traitement.

🔗 Lien vers la plateforme:
${platformUrl}

Rappel: Pensez à marquer l'AO comme "lu" une fois consulté.

---
📧 Email automatique - Ne pas répondre
HITO Digital - Plateforme de gestion des AO
  `.trim()
}

/**
 * Récupère l'email du commercial depuis la base de données
 */
async function getSalesRepEmail(assignedTo: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('sales_reps')
      .select('email, name')
      .eq('id', assignedTo)
      .single()

    if (error || !data) {
      console.error('Error fetching sales rep email:', error)
      return null
    }

    console.log(`Found sales rep: ${data.name} (${data.email})`)
    return data.email
  } catch (error) {
    console.error('Failed to get sales rep email:', error)
    return null
  }
}

/**
 * Envoie l'email via SendGrid
 */
async function sendEmailWithSendGrid(to: string, subject: string, html: string, text: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
  
  if (!sendGridApiKey) {
    const errorMsg = 'SENDGRID_API_KEY not configured'
    console.error(errorMsg)
    return { success: false, error: errorMsg }
  }

  try {
    console.log(`Sending email via SendGrid to: ${to}`)
    
    // Utiliser l'adresse vérifiée dans SendGrid
    const fromEmail = 'notifications@hito.digital'
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject
          }
        ],
        from: {
          email: fromEmail,
          name: 'HITO Digital'
        },
        reply_to: {
          email: 'noreply@hito.digital',
          name: 'HITO Digital - Ne pas répondre'
        },
        content: [
          {
            type: 'text/plain',
            value: text
          },
          {
            type: 'text/html',
            value: html
          }
        ]
      }),
    })

    const responseText = await response.text()
    console.log(`SendGrid API response (${response.status}):`, responseText)

    if (!response.ok) {
      const errorMsg = `SendGrid API error: ${response.status} - ${responseText}`
      console.error(errorMsg)
      return { success: false, error: errorMsg }
    }

    // SendGrid retourne un 202 avec un X-Message-Id header en cas de succès
    const messageId = response.headers.get('X-Message-Id') || 'unknown'
    console.log('Email sent successfully via SendGrid, Message ID:', messageId)
    return { success: true, messageId }
  } catch (error) {
    const errorMsg = `SendGrid email sending failed: ${error.message || 'Unknown error'}`
    console.error(errorMsg, error)
    return { success: false, error: errorMsg }
  }
}

/**
 * Handler principal
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
    console.log('Processing RFP notification request...')
    
    const data = await req.json() as RFPNotificationData
    console.log('Received data:', {
      rfpId: data.rfpId,
      client: data.client,
      mission: data.mission,
      salesRepCode: data.salesRepCode,
      assignedTo: data.assignedTo
    })
    
    // Validation des données
    if (!data.rfpId || !data.salesRepCode || !data.client || !data.mission || !data.assignedTo) {
      const errorMsg = 'Missing required fields: rfpId, salesRepCode, client, mission, and assignedTo are required'
      console.error(errorMsg)
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: errorMsg
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Récupération de l'email du commercial
    console.log(`Fetching email for sales rep ID: ${data.assignedTo}`)
    const salesRepEmail = await getSalesRepEmail(data.assignedTo)
    
    if (!salesRepEmail) {
      const errorMsg = `No email found for sales rep with ID: ${data.assignedTo}`
      console.error(errorMsg)
      return new Response(
        JSON.stringify({ 
          error: 'Sales rep email not found',
          details: errorMsg
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // URL de la plateforme
    const platformUrl = Deno.env.get('PLATFORM_URL') || 'https://onuznsfzlkguvfdeilff.supabase.co'
    
    // Génération du contenu email
    const subject = `📋 Nouvel AO assigné : ${data.mission}`
    const html = generateEmailHTML(data, platformUrl)
    const text = generateEmailText(data, platformUrl)

    console.log(`Preparing to send email with subject: "${subject}"`)

    // Envoi de l'email via SendGrid
    const emailResult = await sendEmailWithSendGrid(salesRepEmail, subject, html, text)
    
    if (!emailResult.success) {
      console.error('Failed to send email via SendGrid:', emailResult.error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email',
          details: emailResult.error
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Email notification sent successfully to ${salesRepEmail} via SendGrid`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully via SendGrid',
        recipient: salesRepEmail,
        messageId: emailResult.messageId,
        provider: 'SendGrid'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
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