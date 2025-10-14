import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ClientNeedNotificationData {
  prospectId: string
  besoin?: string
  name?: string
  availability?: string
  dailyRate?: number
  salaryExpectations?: number
  residence?: string
  mobility?: string
  phone?: string
  email?: string
  salesRepCode: string
  assignedTo: string
  hasCV: boolean
  fileName?: string
}

/**
 * Récupère les informations complètes du besoin client depuis la base de données
 */
async function getClientNeedDetails(prospectId: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('client_needs')
      .select('selected_need_title, name, availability, daily_rate, salary_expectations, residence, mobility, phone, email, file_name')
      .eq('id', prospectId)
      .single()

    if (error || !data) {
      console.error('Error fetching client need details:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to get client need details:', error)
    return null
  }
}

/**
 * Génère le contenu HTML de l'email pour les besoins clients
 */
function generateEmailHTML(data: ClientNeedNotificationData, salesRepName: string, platformUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouveau profil pour besoin client</title>
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
          background: #008876; 
          color: #ffffff; 
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
        
        .prospect-card { 
          background: #f5f5f7; 
          padding: 32px; 
          border-radius: 16px; 
          margin: 32px 0; 
        }
        
        .prospect-title { 
          font-weight: 600; 
          color: #1d1d1f; 
          font-size: 22px; 
          margin-bottom: 16px; 
          line-height: 1.3;
        }
        
        .prospect-details { 
          color: #6e6e73; 
          font-size: 17px; 
          line-height: 1.6;
        }
        
        .prospect-details div {
          margin-bottom: 8px;
        }
        
        .prospect-details div:last-child {
          margin-bottom: 0;
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
          background: #008876 !important; 
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
          box-shadow: 0 2px 8px rgba(0, 136, 118, 0.3);
        }
        
        .cta-button:hover { 
          background: #007a69 !important;
          color: #ffffff !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 136, 118, 0.4);
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
          
          .prospect-card,
          .action-section {
            padding: 24px;
          }
          
          .cta-button {
            padding: 14px 28px;
            font-size: 16px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>Nouveau profil</h1>
          <p>Pour besoin client</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Bonjour <strong>${salesRepName}</strong>,
          </div>
          
          <p class="intro-text">Un nouveau profil pour besoin client vient d'être ajouté et vous a été assigné :</p>

          <div class="prospect-card">
            <div class="prospect-title">🔍 ${data.name && data.name !== '-' ? data.name : 'Profil candidat'}</div>
            <div class="prospect-details">
              ${data.besoin ? `<div><strong>•</strong> <strong>Besoin :</strong> ${data.besoin}</div>` : ''}
              ${data.availability && data.availability !== '-' ? `<div><strong>•</strong> <strong>Disponibilité :</strong> ${data.availability}</div>` : ''}
              ${data.dailyRate ? `<div><strong>•</strong> <strong>TJM :</strong> ${data.dailyRate}€</div>` : ''}
              ${data.salaryExpectations ? `<div><strong>•</strong> <strong>Prétentions salariales :</strong> ${data.salaryExpectations}€</div>` : ''}
              ${data.residence && data.residence !== '-' ? `<div><strong>•</strong> <strong>Résidence :</strong> ${data.residence}</div>` : ''}
              ${data.mobility && data.mobility !== '-' ? `<div><strong>•</strong> <strong>Mobilité :</strong> ${data.mobility}</div>` : ''}
              ${data.phone && data.phone !== '-' ? `<div><strong>•</strong> <strong>Téléphone :</strong> ${data.phone}</div>` : ''}
              ${data.email && data.email !== '-' ? `<div><strong>•</strong> <strong>Email :</strong> ${data.email}</div>` : ''}
              ${data.hasCV ? '<div><strong>•</strong> <strong>CV :</strong> Disponible pour analyse</div>' : ''}
              <div><strong>•</strong> <strong>Objectif :</strong> Staffing sur besoin client</div>
            </div>
          </div>
          
          <div class="action-section">
            <div class="action-title">Action requise</div>
            <p class="action-text">
              Connectez-vous à la plateforme pour consulter tous les détails du profil et évaluer son adéquation avec le besoin.
            </p>
            <a href="${platformUrl}" class="cta-button">
              Consulter le profil
            </a>
          </div>
          
          <div class="reminder-section">
            <p class="reminder-text">
              <strong>💡</strong> Pensez à marquer le profil comme "Traité" une fois consulté pour optimiser le suivi.
            </p>
          </div>
        </div>
        
        <div class="footer">
          <div>Email automatique • Ne pas répondre</div>
          <div>GOJO • Plateforme de gestion des profils</div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Génère le contenu texte de l'email
 */
function generateEmailText(data: ClientNeedNotificationData, salesRepName: string, platformUrl: string): string {
  return `
Nouveau profil pour besoin client

Bonjour ${salesRepName},

Un nouveau profil pour besoin client vient d'être ajouté et vous a été assigné :

🔍 ${data.name && data.name !== '-' ? data.name : 'Profil candidat'}
${data.besoin ? `• Besoin : ${data.besoin}` : ''}
${data.availability && data.availability !== '-' ? `• Disponibilité : ${data.availability}` : ''}
${data.dailyRate ? `• TJM : ${data.dailyRate}€` : ''}
${data.salaryExpectations ? `• Prétentions salariales : ${data.salaryExpectations}€` : ''}
${data.residence && data.residence !== '-' ? `• Résidence : ${data.residence}` : ''}
${data.mobility && data.mobility !== '-' ? `• Mobilité : ${data.mobility}` : ''}
${data.phone && data.phone !== '-' ? `• Téléphone : ${data.phone}` : ''}
${data.email && data.email !== '-' ? `• Email : ${data.email}` : ''}
${data.hasCV ? '• CV : Disponible pour analyse' : ''}
• Objectif : Staffing sur besoin client

Action requise :
Connectez-vous à la plateforme pour consulter tous les détails du profil et évaluer son adéquation avec le besoin.

Lien vers la plateforme :
${platformUrl}

💡 Pensez à marquer le profil comme "Traité" une fois consulté.

---
Email automatique - Ne pas répondre
GOJO - Plateforme de gestion des profils
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
    console.log(`Sending client need notification email via SendGrid to: ${to}`)
    
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

    const messageId = response.headers.get('X-Message-Id') || 'unknown'
    console.log('Client need notification email sent successfully via SendGrid, Message ID:', messageId)
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
    console.log('Processing client need notification request...')
    
    const data = await req.json() as ClientNeedNotificationData
    console.log('Received data:', {
      prospectId: data.prospectId,
      besoin: data.besoin,
      salesRepCode: data.salesRepCode,
      assignedTo: data.assignedTo,
      hasCV: data.hasCV
    })
    
    // Validation des données
    if (!data.prospectId || !data.salesRepCode || !data.assignedTo) {
      const errorMsg = 'Missing required fields: prospectId, salesRepCode, and assignedTo are required'
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

    // Récupération des détails complets du besoin client
    console.log('📋 Fetching client need details from database...')
    const clientNeedDetails = await getClientNeedDetails(data.prospectId)

    if (clientNeedDetails) {
      // Enrichir les données avec les informations complètes de la DB
      data.besoin = clientNeedDetails.selected_need_title
      data.name = clientNeedDetails.name
      data.availability = clientNeedDetails.availability
      data.dailyRate = clientNeedDetails.daily_rate
      data.salaryExpectations = clientNeedDetails.salary_expectations
      data.residence = clientNeedDetails.residence
      data.mobility = clientNeedDetails.mobility
      data.phone = clientNeedDetails.phone
      data.email = clientNeedDetails.email
      data.fileName = clientNeedDetails.file_name
      data.hasCV = !!clientNeedDetails.file_name
      console.log('✅ Client need details enriched from database')
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
    
    // URL de la plateforme avec navigation vers l'onglet Besoins Clients
    const baseUrl = Deno.env.get('PLATFORM_URL') || 'https://ao-extractor-v2-en-c-l194.bolt.host'
    const platformUrl = `${baseUrl}?tab=boondmanager-prospects`
    
    // Génération du contenu email
    const subject = `Nouveau profil pour besoin client : ${data.besoin}`
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

    console.log(`Client need notification email sent successfully to ${salesRepInfo.email} via SendGrid`)
    
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