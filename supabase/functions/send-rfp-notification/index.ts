import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RFPNotificationData {
  rfpId: string
  client: string
  mission: string
  location?: string
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
function generateEmailHTML(data: RFPNotificationData, salesRepName: string, platformUrl: string): string {
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
          font-size: 16px;
        }
        .container { 
          max-width: 700px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
          overflow: hidden; 
        }
        .header { 
          background: linear-gradient(135deg, #1651EE 0%, #4F46E5 100%); 
          color: white; 
          padding: 40px 32px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 600; 
        }
        .header p { 
          margin: 12px 0 0 0; 
          opacity: 0.9; 
          font-size: 18px; 
        }
        .content { 
          padding: 40px 32px; 
        }
        .greeting { 
          font-size: 16px; 
          margin-bottom: 24px; 
          font-weight: 400;
        }
        .intro-text {
          font-size: 16px;
          margin-bottom: 24px;
          color: #4a5568;
          font-weight: 400;
        }
        .mission-card { 
          background: #f1f5f9; 
          border-left: 4px solid #1651EE; 
          padding: 24px; 
          border-radius: 8px; 
          margin: 24px 0; 
        }
        .mission-title { 
          font-weight: 600; 
          color: #1e293b; 
          font-size: 20px; 
          margin-bottom: 8px; 
        }
        .client-name { 
          color: #64748b; 
          font-size: 16px; 
          font-weight: 400; 
          margin-bottom: 4px;
        }
        .cta-section { 
          text-align: center; 
          margin: 32px 0; 
        }
        .cta-button { 
          display: inline-block; 
          background: #1651EE; 
          color: white; 
          padding: 18px 40px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px; 
          transition: background-color 0.2s; 
          border: none;
          cursor: pointer;
        }
        .cta-button:hover { 
          background: #1e40af; 
          color: white;
        }
        .instructions { 
          background: #f1f5f9; 
          border: 1px solid #cbd5e1; 
          border-radius: 8px; 
          padding: 20px; 
          margin: 24px 0; 
        }
        .instructions-title { 
          font-weight: 600; 
          color: #334155; 
          font-size: 16px;
          margin-bottom: 8px; 
        }
        .instructions-text { 
          color: #475569; 
          font-size: 16px; 
          margin: 0; 
          font-weight: 400;
        }
        .reminder-text {
          font-size: 16px;
          color: #64748b;
          margin-top: 24px;
          font-weight: 400;
        }
        .footer { 
          text-align: center; 
          color: #64748b; 
          font-size: 14px; 
          padding: 32px; 
          border-top: 1px solid #e2e8f0; 
          background: #f8fafc; 
          font-weight: 400;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nouvel AO assigné</h1>
          <p>Un appel d'offres vous attend</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Bonjour <strong>${salesRepName}</strong>,
          </div>
          
          <p class="intro-text">Un nouvel appel d'offres vient d'être analysé et vous a été assigné automatiquement :</p>
          
          <div class="mission-card">
            <div class="mission-title">${data.mission}</div>
            <div class="client-name">Client : ${data.client}</div>
            <div class="client-name">Localisation : ${data.location || 'Non spécifiée'}</div>
          </div>
          
          <div class="instructions">
            <div class="instructions-title">Action requise</div>
            <p class="instructions-text">
              Connectez-vous à la plateforme pour consulter tous les détails de cet AO et commencer le traitement.
            </p>
          </div>
          
          <div class="cta-section">
            <a href="${platformUrl}" class="cta-button">
              Consulter l'AO
            </a>
          </div>
          
          <p class="reminder-text">
            <strong>Rappel :</strong> Pensez à marquer l'AO comme "lu" une fois consulté pour optimiser le suivi.
          </p>
        </div>
        
        <div class="footer">
          <div>Email automatique • Ne pas répondre</div>
          <div style="margin-top: 8px;">Plateforme de gestion des AO</div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Génère le contenu texte de l'email
 */
function generateEmailText(data: RFPNotificationData, salesRepName: string, platformUrl: string): string {
  return `
Nouvel AO assigné

Bonjour ${salesRepName},

Un nouvel appel d'offres vient d'être analysé et vous a été assigné :

Mission: ${data.mission}
Client: ${data.client}
Localisation: ${data.location || 'Non spécifiée'}

Action requise:
Connectez-vous à la plateforme pour consulter tous les détails et commencer le traitement.

Lien vers la plateforme:
${platformUrl}

Rappel: Pensez à marquer l'AO comme "lu" une fois consulté.

---
Email automatique - Ne pas répondre
Plateforme de gestion des AO
  `.trim()
}

/**
 * Récupère les informations du commercial depuis la base de données
 */
async function getSalesRepInfo(assignedTo: string): Promise<{email: string, name: string} | null> {
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
      console.error('Error fetching sales rep info:', error)
      return null
    }

    console.log(`Found sales rep: ${data.name} (${data.email})`)
    return { email: data.email, name: data.name }
  } catch (error) {
    console.error('Failed to get sales rep info:', error)
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

    // Récupération des informations du commercial
    console.log(`Fetching info for sales rep ID: ${data.assignedTo}`)
    const salesRepInfo = await getSalesRepInfo(data.assignedTo)
    
    if (!salesRepInfo) {
      const errorMsg = `No info found for sales rep with ID: ${data.assignedTo}`
      console.error(errorMsg)
      return new Response(
        JSON.stringify({ 
          error: 'Sales rep info not found',
          details: errorMsg
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extraire le prénom uniquement
    const firstName = salesRepInfo.name.split(' ')[0]
    
    // URL de la plateforme
    const platformUrl = Deno.env.get('PLATFORM_URL') || 'https://onuznsfzlkguvfdeilff.supabase.co'
    
    // Génération du contenu email
    const subject = `Nouvel AO assigné : ${data.mission} - ${data.client}`
    const html = generateEmailHTML(data, firstName, platformUrl)
    const text = generateEmailText(data, firstName, platformUrl)

    console.log(`Preparing to send email with subject: "${subject}"`)

    // Envoi de l'email via SendGrid
    const emailResult = await sendEmailWithSendGrid(salesRepInfo.email, subject, html, text)
    
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

    console.log(`Email notification sent successfully to ${salesRepInfo.email} via SendGrid`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully via SendGrid',
        recipient: salesRepInfo.email,
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