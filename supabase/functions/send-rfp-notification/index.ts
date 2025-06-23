import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
 * Génère le contenu HTML concis de l'email
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }
        .header { background: linear-gradient(135deg, #1651EE 0%, #4F46E5 100%); color: white; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
        .content { padding: 24px; }
        .mission-card { background: #f1f5f9; border-left: 4px solid #1651EE; padding: 16px; border-radius: 6px; margin: 16px 0; }
        .mission-title { font-weight: 600; color: #1e293b; margin-bottom: 4px; }
        .client-name { color: #64748b; font-size: 14px; }
        .cta-button { display: inline-block; background: #1651EE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 20px 0; transition: background-color 0.2s; }
        .cta-button:hover { background: #1e40af; }
        .footer { text-align: center; color: #64748b; font-size: 12px; padding: 16px 24px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Nouvel AO assigné</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${data.salesRepCode}</strong>,</p>
          <p>Un nouvel appel d'offres vous a été assigné :</p>
          
          <div class="mission-card">
            <div class="mission-title">${data.mission}</div>
            <div class="client-name">${data.client}</div>
          </div>
          
          <div style="text-align: center;">
            <a href="${platformUrl}" class="cta-button">
              Consulter l'AO
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
            Connectez-vous à la plateforme pour voir tous les détails et commencer le traitement.
          </p>
        </div>
        
        <div class="footer">
          Email automatique • Ne pas répondre
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
Nouvel AO assigné

Bonjour ${data.salesRepCode},

Un nouvel appel d'offres vous a été assigné :

Mission: ${data.mission}
Client: ${data.client}

Consultez l'AO complet sur la plateforme :
${platformUrl}

---
Email automatique - Ne pas répondre
  `.trim()
}

/**
 * Récupère l'email du commercial depuis les variables d'environnement
 */
function getSalesRepEmail(salesRepCode: string): string | null {
  const emailMapping: Record<string, string> = {
    'IKH': Deno.env.get('EMAIL_IKH') || '',
    'BVI': Deno.env.get('EMAIL_BVI') || '',
    'GMA': Deno.env.get('EMAIL_GMA') || '',
    'TSA': Deno.env.get('EMAIL_TSA') || '',
    'EPO': Deno.env.get('EMAIL_EPO') || '',
    'BCI': Deno.env.get('EMAIL_BCI') || '',
    'VIE': Deno.env.get('EMAIL_VIE') || '',
  }

  const email = emailMapping[salesRepCode]
  if (!email) {
    console.error('No email configured for sales rep:', salesRepCode)
    return null
  }

  return email
}

/**
 * Envoie l'email via Resend
 */
async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured')
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('FROM_EMAIL') || 'noreply@gojo.fr',
        to: [to],
        subject,
        html,
        text,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Resend API error:', response.status, errorData)
      return false
    }

    const result = await response.json()
    console.log('Email sent successfully:', result.id)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

/**
 * Handler principal
 */
serve(async (req) => {
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
    const data = await req.json() as RFPNotificationData
    
    // Validation
    if (!data.rfpId || !data.salesRepCode || !data.client || !data.mission) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Récupération de l'email du commercial
    const salesRepEmail = getSalesRepEmail(data.salesRepCode)
    if (!salesRepEmail) {
      return new Response(
        JSON.stringify({ error: 'Sales rep email not configured' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // URL de la plateforme
    const platformUrl = Deno.env.get('PLATFORM_URL') || 'https://votre-plateforme.com'
    
    // Génération du contenu email
    const subject = `📋 Nouvel AO : ${data.mission}`
    const html = generateEmailHTML(data, platformUrl)
    const text = generateEmailText(data, platformUrl)

    // Envoi de l'email
    const emailSent = await sendEmail(salesRepEmail, subject, html, text)
    
    if (!emailSent) {
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        recipient: salesRepEmail 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})