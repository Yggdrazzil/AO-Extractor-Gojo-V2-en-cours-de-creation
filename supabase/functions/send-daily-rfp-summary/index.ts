import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RFP {
  id: string
  client: string
  mission: string
  location: string
  max_rate: number | null
  created_at: string | null
  start_date: string | null
}

interface SalesRep {
  id: string
  name: string
  code: string
  email: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Formate une date pour l'affichage
 */
function formatDate(dateStr: string | null): string {
  console.log('📅 formatDate called with:', dateStr)
  
  if (!dateStr) return 'Non spécifiée'
  
  try {
    // Si la date est déjà au format DD/MM/YYYY, la retourner telle quelle
    const cleanDate = dateStr.trim()
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDate)) {
      console.log('📅 Date already in French format:', cleanDate)
      return cleanDate
    }
    
    // Pour les dates ISO, les convertir en format français sans problème de timezone
    console.log('📅 Converting ISO date:', cleanDate)
    const date = new Date(cleanDate + 'T12:00:00Z') // Forcer UTC midi pour éviter les décalages de timezone
    if (isNaN(date.getTime())) {
      console.log('📅 Invalid date, returning default')
      return 'Non spécifiée'
    }
    
    const formatted = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    console.log('📅 Formatted date result:', formatted)
    return formatted
  } catch {
    console.log('📅 Error formatting date, returning default')
    return 'Non spécifiée'
  }
}

/**
 * Génère le tableau HTML des AOs
 */
function generateRFPTable(rfps: RFP[]): string {
  const rows = rfps.map(rfp => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 16px 12px; font-size: 15px; color: #1d1d1f; font-weight: 500; line-height: 1.4;">
        ${rfp.client}
      </td>
      <td style="padding: 16px 12px; font-size: 15px; color: #1d1d1f; line-height: 1.4;">
        ${rfp.mission}
      </td>
      <td style="padding: 16px 12px; font-size: 15px; color: #6e6e73;">
        ${rfp.location}
      </td>
      <td style="padding: 16px 12px; font-size: 15px; color: #6e6e73; text-align: center;">
        ${rfp.max_rate ? `${rfp.max_rate}€` : '-'}
      </td>
      <td style="padding: 16px 12px; font-size: 15px; color: #6e6e73; text-align: center;">
        ${formatDate(rfp.start_date)}
      </td>
    </tr>
  `).join('')

  return `
    <table style="width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
      <thead>
        <tr style="background: #f8f9fa; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 20px 12px; text-align: left; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
            Client
          </th>
          <th style="padding: 20px 12px; text-align: left; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
            Mission
          </th>
          <th style="padding: 20px 12px; text-align: left; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
            Localisation
          </th>
          <th style="padding: 20px 12px; text-align: center; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
            TJM Max
          </th>
          <th style="padding: 20px 12px; text-align: center; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
            Démarrage
          </th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `
}

/**
 * Génère le contenu HTML de l'email quotidien
 */
function generateDailySummaryHTML(salesRepName: string, rfps: RFP[], platformUrl: string): string {
  const rfpCount = rfps.length
  const pluriel = rfpCount > 1 ? 's' : ''
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Récapitulatif quotidien des AOs</title>
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
        
        .summary-text {
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
        
        .cta-section { 
          text-align: center; 
          margin: 48px 0 32px 0;
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
          <h1>Récapitulatif quotidien</h1>
          <p>Vos AOs en attente de traitement</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Bonjour <strong>${salesRepName}</strong>,
          </div>
          
          <p class="summary-text">
            Voici le récapitulatif de vos appels d'offres en statut "À traiter" pour ce ${new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })} :
          </p>
          
          <div class="stats-card">
            <div class="stats-number">${rfpCount}</div>
            <div class="stats-label">AO${pluriel} à traiter</div>
          </div>
          
          <div class="table-container">
            ${generateRFPTable(rfps)}
          </div>
          
          <div class="cta-section">
            <a href="${platformUrl}" class="cta-button">
              Accéder à la plateforme
            </a>
          </div>
        </div>
        
        <div class="footer">
          <div>Email automatique quotidien • Ne pas répondre</div>
          <div>GOJO • Plateforme de gestion des AO • Envoyé à 9h00</div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Génère le contenu texte de l'email quotidien
 */
function generateDailySummaryText(salesRepName: string, rfps: RFP[], platformUrl: string): string {
  const rfpList = rfps.map((rfp, index) => 
    `${index + 1}. ${rfp.mission} - ${rfp.client} (${rfp.location})`
  ).join('\n')
  
  return `
Récapitulatif quotidien des AOs

Bonjour ${salesRepName},

Vous avez ${rfps.length} AO(s) en statut "À traiter" :

${rfpList}

Accédez à la plateforme pour traiter ces AOs :
${platformUrl}

---
Email automatique quotidien - Ne pas répondre
GOJO - Plateforme de gestion des AO - Envoyé à 9h00
  `.trim()
}

/**
 * Récupère tous les commerciaux
 */
async function getAllSalesReps(): Promise<SalesRep[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('sales_reps')
      .select('id, name, code, email')
      .order('code')

    if (error) {
      console.error('Error fetching sales reps:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to get sales reps:', error)
    return []
  }
}

/**
 * Récupère les AOs "À traiter" pour un commercial
 */
async function getPendingRFPsForSalesRep(salesRepId: string): Promise<RFP[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('rfps')
      .select('id, client, mission, location, max_rate, created_at, start_date')
      .eq('assigned_to', salesRepId)
      .eq('status', 'À traiter')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching RFPs for sales rep:', salesRepId, error)
      return []
    }

    // Debug: afficher les données récupérées
    console.log(`📊 Raw RFP data for ${salesRepId}:`, JSON.stringify(data, null, 2))
    
    if (data && data.length > 0) {
      data.forEach((rfp, index) => {
        console.log(`📅 RFP ${index + 1} start_date:`, rfp.start_date, 'type:', typeof rfp.start_date)
      })
    }
    return data || []
  } catch (error) {
    console.error('Failed to get RFPs for sales rep:', salesRepId, error)
    return []
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
    console.log(`Sending daily summary email via SendGrid to: ${to}`)
    
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
    console.log('Daily summary email sent successfully via SendGrid, Message ID:', messageId)
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
    console.log('Processing daily RFP summary request...')
    
    // URL de la plateforme
    const platformUrl = Deno.env.get('PLATFORM_URL') || 'https://hito-gojo-platform.netlify.app/'
    
    // Récupérer tous les commerciaux
    const salesReps = await getAllSalesReps()
    console.log(`Found ${salesReps.length} sales reps`)
    
    if (salesReps.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No sales reps found',
          emailsSent: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    let emailsSent = 0
    const results = []
    
    // Pour chaque commercial, vérifier s'il a des AOs à traiter
    for (const salesRep of salesReps) {
      try {
        console.log(`Processing sales rep: ${salesRep.name} (${salesRep.code})`)
        
        // Récupérer les AOs en attente pour ce commercial
        const pendingRFPs = await getPendingRFPsForSalesRep(salesRep.id)
        console.log(`Found ${pendingRFPs.length} pending RFPs for ${salesRep.code}`)
        
        // Si pas d'AOs à traiter, passer au suivant
        if (pendingRFPs.length === 0) {
          console.log(`No pending RFPs for ${salesRep.code}, skipping email`)
          results.push({
            salesRep: salesRep.code,
            email: salesRep.email,
            pendingRFPs: 0,
            emailSent: false,
            reason: 'No pending RFPs'
          })
          continue
        }
        
        // Extraire le prénom
        const firstName = salesRep.name.split(' ')[0]
        
        // Générer le contenu de l'email
        const subject = `Récapitulatif quotidien : ${pendingRFPs.length} AO${pendingRFPs.length > 1 ? 's' : ''} à traiter`
        const html = generateDailySummaryHTML(firstName, pendingRFPs, platformUrl)
        const text = generateDailySummaryText(firstName, pendingRFPs, platformUrl)
        
        // Envoyer l'email
        const emailResult = await sendEmailWithSendGrid(salesRep.email, subject, html, text)
        
        if (emailResult.success) {
          emailsSent++
          console.log(`Daily summary sent successfully to ${salesRep.email}`)
          results.push({
            salesRep: salesRep.code,
            email: salesRep.email,
            pendingRFPs: pendingRFPs.length,
            emailSent: true,
            messageId: emailResult.messageId
          })
        } else {
          console.error(`Failed to send daily summary to ${salesRep.email}:`, emailResult.error)
          results.push({
            salesRep: salesRep.code,
            email: salesRep.email,
            pendingRFPs: pendingRFPs.length,
            emailSent: false,
            error: emailResult.error
          })
        }
        
        // Petite pause entre les envois pour éviter de surcharger SendGrid
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Error processing sales rep ${salesRep.code}:`, error)
        results.push({
          salesRep: salesRep.code,
          email: salesRep.email,
          pendingRFPs: 0,
          emailSent: false,
          error: error.message
        })
      }
    }
    
    console.log(`Daily summary process completed. Emails sent: ${emailsSent}/${salesReps.length}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Daily summary process completed`,
        emailsSent,
        totalSalesReps: salesReps.length,
        results
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