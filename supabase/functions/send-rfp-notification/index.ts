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
 * Génère le contenu HTML de l'email - Style Flat Design Apple
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
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif; 
          line-height: 1.5; 
          color: #1d1d1f; 
          margin: 0; 
          padding: 32px 16px; 
          background-color: #f5f5f7; 
          font-size: 17px;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .email-container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: #ffffff; 
          border-radius: 18px; 
          overflow: hidden; 
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .header { 
          background: #1651EE; 
          color: #f5f5f7; 
          padding: 48px 32px; 
          text-align: center; 
        }
        
        .header h1 { 
          font-size: 32px; 
          font-weight: 600; 
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }
        
        .header p { 
          font-size: 19px; 
          opacity: 0.8; 
          font-weight: 400;
        }
        
        .content { 
          padding: 48px 32px; 
        }
        
        .greeting { 
          font-size: 17px; 
          margin-bottom: 32px; 
          color: #1d1d1f;
        }
        
        .intro-text {
          font-size: 17px;
          margin-bottom: 32px;
          color: #424245;
          line-height: 1.6;
        }
        
        .stats-card {
          background: #f5f5f7; 
          padding: 24px;
          border-radius: 16px; 
          margin: 32px 0; 
          text-align: center;
        }
        
        .stats-number {
          font-size: 48px;
          font-weight: 700;
          color: #1651EE;
          margin-bottom: 8px;
          line-height: 1;
        }
        
        .stats-label {
          font-size: 17px;
          color: #6e6e73;
          font-weight: 500;
        }
        
        .table-container {
          margin: 32px 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          background: #ffffff;
        }
        
        thead tr {
          background: #f8f9fa;
          border-bottom: 2px solid #e5e7eb;
        }
        
        th {
          padding: 20px 12px;
          text-align: left;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        tbody tr {
          border-bottom: 1px solid #e5e7eb;
        }
        
        td {
          padding: 16px 12px;
          font-size: 15px;
          color: #1d1d1f;
          line-height: 1.4;
        }
        
        .mission-title {
          font-weight: 500;
          color: #1d1d1f;
        }
        
        .client-name {
          color: #6e6e73;
        }
        
        .action-section { 
          background: #f5f5f7; 
          border-radius: 16px; 
          padding: 32px; 
          margin: 32px 0; 
          text-align: center;
        }
        
        .action-title { 
          font-weight: 600; 
          color: #1d1d1f; 
          font-size: 19px;
          margin-bottom: 16px; 
        }
        
        .action-text { 
          color: #6e6e73; 
          font-size: 17px; 
          margin-bottom: 32px;
          line-height: 1.6;
        }
        
        .cta-button { 
          display: inline-block; 
          background: #1651EE !important; 
          color: #ffffff !important; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 12px; 
          font-weight: 600; 
          font-size: 17px; 
          letter-spacing: -0.2px;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(22, 81, 238, 0.3);
        }
        
        .cta-button:hover { 
          background: #1240cc !important;
          color: #ffffff !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(22, 81, 238, 0.4);
        }
        
        .cta-button:visited {
          color: #ffffff !important;
        }
        
        .cta-button:active {
          color: #ffffff !important;
        }
        
        .cta-button:link {
          color: #ffffff !important;
        }
        
        .reminder-section {
          margin-top: 32px;
          padding: 24px;
          background: #f5f5f7;
          border-radius: 12px;
        }
        
        .reminder-text {
          font-size: 15px;
          color: #6e6e73;
          line-height: 1.6;
        }
        
        .footer { 
          text-align: center; 
          color: #86868b; 
          font-size: 13px; 
          padding: 32px; 
          background: #f5f5f7; 
          line-height: 1.6;
        }
        
        .footer div {
          margin-bottom: 4px;
        }
        
        .footer div:last-child {
          margin-bottom: 0;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
          body {
            padding: 16px 8px;
          }
          
          .email-container {
            max-width: 100%;
          }
          
          .header {
            padding: 32px 24px;
          }
          
          .header h1 {
            font-size: 28px;
          }
          
          .content {
            padding: 32px 24px;
          }
          
          .stats-number {
            font-size: 36px;
          }
          
          .action-section {
            padding: 24px;
          }
          
          .cta-button {
            padding: 14px 28px;
            font-size: 16px;
          }
          
          table {
            font-size: 14px;
          }
          
          th, td {
            padding: 12px 8px !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>Nouvel AO assigné</h1>
          <p>Un appel d'offres vous attend</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Bonjour <strong>${salesRepName}</strong>,
          </div>
          
          <p class="intro-text">
            Un nouvel Appel d'Offres vient vous a été assigné :
          </p>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Mission</th>
                  <th>Localisation</th>
                  <th style="text-align: center;">TJM Max</th>
                  <th style="text-align: center;">Démarrage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="client-name">${data.client}</td>
                  <td class="mission-title">${data.mission}</td>
                  <td class="client-name">${data.location || 'Non spécifiée'}</td>
                  <td style="text-align: center;" class="client-name">-</td>
                  <td style="text-align: center;" class="client-name">-</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="action-section">
            <div class="action-title">Action requise</div>
            <p class="action-text">
              Connectez-vous à la plateforme pour consulter tous les détails de cet AO et commencer le traitement.
            </p>
            <a href="${platformUrl}" class="cta-button">
              Consulter l'AO
            </a>
          </div>
          
          <div class="reminder-section">
            <p class="reminder-text">
              <strong>💡</strong> Pensez à marquer l'AO comme "Traité" une fois consulté pour optimiser le suivi.
            </p>
          </div>
        </div>
        
        <div class="footer">
          <div>Email automatique • Ne pas répondre</div>
          <div>GOJO • Plateforme de gestion des AO</div>
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

💡 Pensez à marquer l'AO comme "Traité" une fois consulté.

---
Email automatique - Ne pas répondre
GOJO - Plateforme de gestion des AO
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
          name: 'GOJO'
        },
        reply_to: {
          email: 'noreply@hito.digital',
          name: 'GOJO - Ne pas répondre'
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
    const platformUrl = Deno.env.get('PLATFORM_URL') || 'https://hito-gojo-platform.netlify.app/'
    
    // Génération du contenu email avec le nom du client dans l'objet
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