import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  to: string
  subject: string
  html: string
}

async function sendEmail(emailData: EmailData) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AO Extractor <noreply@votre-domaine.com>',
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }

  return await response.json()
}

function generateEmailHTML(rfpData: any, salesRepName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouvel Appel d'Offres</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #1651EE;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: #1651EE;
          border-radius: 50%;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
        }
        h1 {
          color: #1651EE;
          margin: 0;
          font-size: 24px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 25px;
          color: #666;
        }
        .rfp-details {
          background: #f8f9fa;
          border-radius: 6px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          margin-bottom: 12px;
          align-items: flex-start;
        }
        .detail-label {
          font-weight: 600;
          color: #333;
          min-width: 140px;
          margin-right: 10px;
        }
        .detail-value {
          color: #555;
          flex: 1;
        }
        .highlight {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #1651EE;
          margin: 20px 0;
        }
        .cta-button {
          display: inline-block;
          background: #1651EE;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 14px;
          color: #666;
          text-align: center;
        }
        .status-badge {
          display: inline-block;
          background: #ff9800;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">G</div>
          <h1>Nouvel Appel d'Offres</h1>
        </div>
        
        <div class="greeting">
          Bonjour ${salesRepName},
        </div>
        
        <p>Un nouvel appel d'offres vient d'être ajouté et vous a été assigné :</p>
        
        <div class="rfp-details">
          <div class="detail-row">
            <span class="detail-label">Client :</span>
            <span class="detail-value"><strong>${rfpData.client}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Mission :</span>
            <span class="detail-value">${rfpData.mission}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Localisation :</span>
            <span class="detail-value">${rfpData.location}</span>
          </div>
          ${rfpData.max_rate ? `
          <div class="detail-row">
            <span class="detail-label">TJM Maximum :</span>
            <span class="detail-value">${rfpData.max_rate}€</span>
          </div>
          ` : ''}
          ${rfpData.start_date ? `
          <div class="detail-row">
            <span class="detail-label">Date de démarrage :</span>
            <span class="detail-value">${new Date(rfpData.start_date).toLocaleDateString('fr-FR')}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">Statut :</span>
            <span class="detail-value"><span class="status-badge">${rfpData.status}</span></span>
          </div>
        </div>
        
        <div class="highlight">
          <strong>Action requise :</strong> Cet AO nécessite votre attention. Connectez-vous à la plateforme pour consulter les détails complets et commencer le traitement.
        </div>
        
        <div style="text-align: center;">
          <a href="${Deno.env.get('SITE_URL') || 'https://votre-site.com'}" class="cta-button">
            Consulter l'AO
          </a>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par le système AO Extractor.</p>
          <p>Si vous avez des questions, contactez l'équipe support.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record } = await req.json()
    
    // Récupérer les informations du commercial assigné
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: salesRep, error: salesRepError } = await supabase
      .from('sales_reps')
      .select('name, code')
      .eq('id', record.assigned_to)
      .single()
    
    if (salesRepError || !salesRep) {
      console.error('Sales rep not found:', salesRepError)
      return new Response(
        JSON.stringify({ error: 'Sales rep not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Construire l'email du commercial basé sur son code
    const salesRepEmail = `${salesRep.code.toLowerCase()}@votre-domaine.com`
    
    // Générer le contenu de l'email
    const emailHTML = generateEmailHTML(record, salesRep.name)
    
    // Envoyer l'email
    const emailResult = await sendEmail({
      to: salesRepEmail,
      subject: `🔔 Nouvel AO assigné : ${record.client} - ${record.mission}`,
      html: emailHTML
    })
    
    console.log('Email sent successfully:', emailResult)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification sent',
        emailId: emailResult.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (error) {
    console.error('Error sending email notification:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email notification',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})