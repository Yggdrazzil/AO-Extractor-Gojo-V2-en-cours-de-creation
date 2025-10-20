import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ReferenceNotificationData {
  referenceId: string
  client?: string
  operational_contact?: string
  phone?: string
  email?: string
  tech_name?: string
  salesRepCode: string
  assignedTo: string
  hasPDF: boolean
  pdfName?: string
  createdByName?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Récupère les informations complètes de la référence depuis la base de données
 */
async function getReferenceDetails(referenceId: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('reference_marketplace')
      .select(`
        client,
        operational_contact,
        phone,
        email,
        tech_name,
        pdf_name,
        created_by
      `)
      .eq('id', referenceId)
      .single()

    if (error || !data) {
      console.error('Error fetching reference details:', error)
      return null
    }

    // Récupérer le nom du créateur depuis sales_reps via l'email de auth.users
    let createdByName = null
    if (data.created_by) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.created_by)

      if (!userError && userData?.user?.email) {
        const { data: salesRepData, error: salesRepError } = await supabase
          .from('sales_reps')
          .select('name')
          .eq('email', userData.user.email)
          .single()

        if (!salesRepError && salesRepData) {
          createdByName = salesRepData.name
        }
      }
    }

    return {
      ...data,
      createdByName
    }
  } catch (error) {
    console.error('Failed to get reference details:', error)
    return null
  }
}

/**
 * Génère le contenu HTML de l'email - Style Flat Design Apple
 */
function generateEmailHTML(data: ReferenceNotificationData, salesRepName: string, platformUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouvelle référence disponible</title>
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
          background: #063970;
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

        .reference-card {
          background: #f5f5f7;
          padding: 32px;
          border-radius: 16px;
          margin: 32px 0;
        }

        .reference-title {
          font-weight: 600;
          color: #1d1d1f;
          font-size: 22px;
          margin-bottom: 16px;
          line-height: 1.3;
        }

        .reference-details {
          color: #6e6e73;
          font-size: 17px;
          line-height: 1.6;
        }

        .reference-details div {
          margin-bottom: 8px;
        }

        .reference-details div:last-child {
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
          background: #063970 !important;
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
          box-shadow: 0 2px 8px rgba(6, 57, 112, 0.3);
        }

        .cta-button:hover {
          background: #0a4a8a !important;
          color: #ffffff !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(6, 57, 112, 0.4);
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

          .reference-card,
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
          <h1>Nouvelle référence</h1>
          <p>Marketplace des références</p>
        </div>

        <div class="content">
          <div class="greeting">
            Bonjour <strong>${salesRepName}</strong>,
          </div>

          <p class="intro-text">${data.createdByName ? `<strong>${data.createdByName}</strong> vous a attribué une prise de référence à réaliser auprès d'un de vos client / prospect :` : 'Une nouvelle référence client vient d\'être ajoutée à la marketplace et vous a été assignée :'}</p>

          <div class="reference-card">
            <div class="reference-title">📚 ${data.client || 'Client'}</div>
            <div class="reference-details">
              ${data.client ? `<div><strong>•</strong> <strong>Client :</strong> ${data.client}</div>` : ''}
              ${data.operational_contact ? `<div><strong>•</strong> <strong>Opérationnel à contacter :</strong> ${data.operational_contact}</div>` : ''}
              ${data.tech_name ? `<div><strong>•</strong> <strong>Nom du Tech :</strong> ${data.tech_name}</div>` : ''}
              ${data.phone ? `<div><strong>•</strong> <strong>Téléphone :</strong> ${data.phone}</div>` : ''}
              ${data.email ? `<div><strong>•</strong> <strong>Email :</strong> ${data.email}</div>` : ''}
              ${data.hasPDF ? '<div><strong>•</strong> <strong>PDF :</strong> Document disponible</div>' : ''}
            </div>
          </div>

          <div class="action-section">
            <div class="action-title">Action requise</div>
            <p class="action-text">
              Connectez-vous à la plateforme pour consulter tous les détails de cette référence.
            </p>
            <a href="${platformUrl}" class="cta-button">
              Consulter la référence
            </a>
          </div>

          <div class="reminder-section">
            <p class="reminder-text">
              <strong>💡</strong> Cette référence est maintenant visible dans votre marketplace des références.
            </p>
          </div>
        </div>

        <div class="footer">
          <div>Email automatique • Ne pas répondre</div>
          <div>GOJO • Plateforme de gestion des références</div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Génère le contenu texte de l'email
 */
function generateEmailText(data: ReferenceNotificationData, salesRepName: string, platformUrl: string): string {
  return `
Nouvelle référence disponible

Bonjour ${salesRepName},

${data.createdByName ? `${data.createdByName} vous a attribué une prise de référence à réaliser auprès d'un de vos client / prospect :` : 'Une nouvelle référence client vient d\'être ajoutée à la marketplace et vous a été assignée :'}

📚 ${data.client || 'Client'}
${data.client ? `• Client : ${data.client}` : ''}
${data.operational_contact ? `• Opérationnel à contacter : ${data.operational_contact}` : ''}
${data.tech_name ? `• Nom du Tech : ${data.tech_name}` : ''}
${data.phone ? `• Téléphone : ${data.phone}` : ''}
${data.email ? `• Email : ${data.email}` : ''}
${data.hasPDF ? '• PDF : Document disponible' : ''}

Action requise :
Connectez-vous à la plateforme pour consulter tous les détails de cette référence.

Lien vers la plateforme :
${platformUrl}

💡 Cette référence est maintenant visible dans votre marketplace des références.

---
Email automatique - Ne pas répondre
GOJO - Plateforme de gestion des références
  `.trim()
}

/**
 * Récupère les informations du commercial depuis la base de données
 */
async function getSalesRepInfo(assignedTo: string): Promise<{email: string, name: string, code: string} | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('sales_reps')
      .select('email, name, code')
      .eq('id', assignedTo)
      .single()

    if (error || !data) {
      console.error('Error fetching sales rep info:', error)
      return null
    }

    console.log(`Found sales rep: ${data.name} (${data.email})`)
    return { email: data.email, name: data.name, code: data.code }
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
    console.log(`Sending reference notification email via SendGrid to: ${to}`)

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
    console.log('Reference notification email sent successfully via SendGrid, Message ID:', messageId)
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
    console.log('Processing reference notification request...')

    const data = await req.json() as ReferenceNotificationData
    console.log('Received data:', {
      referenceId: data.referenceId,
      client: data.client,
      salesRepCode: data.salesRepCode,
      assignedTo: data.assignedTo,
      hasPDF: data.hasPDF
    })

    if (!data.referenceId || !data.salesRepCode || !data.assignedTo) {
      const errorMsg = 'Missing required fields: referenceId, salesRepCode, and assignedTo are required'
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

    console.log('📋 Fetching reference details from database...')
    const referenceDetails = await getReferenceDetails(data.referenceId)

    if (referenceDetails) {
      data.client = referenceDetails.client
      data.operational_contact = referenceDetails.operational_contact
      data.phone = referenceDetails.phone
      data.email = referenceDetails.email
      data.tech_name = referenceDetails.tech_name
      data.pdfName = referenceDetails.pdf_name
      data.hasPDF = !!referenceDetails.pdf_name
      data.createdByName = referenceDetails.createdByName
      console.log('✅ Reference details enriched from database')
    }

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

    const firstName = salesRepInfo.name.split(' ')[0]

    const baseUrl = Deno.env.get('PLATFORM_URL') || 'https://ao-extractor-v2-en-c-l194.bolt.host'
    const platformUrl = `${baseUrl}?tab=marketplace`

    const subject = `Nouvelle référence : ${data.client}`
    const html = generateEmailHTML(data, firstName, platformUrl)
    const text = generateEmailText(data, firstName, platformUrl)

    console.log(`Preparing to send email with subject: "${subject}"`)

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

    console.log(`Reference notification email sent successfully to ${salesRepInfo.email} via SendGrid`)

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