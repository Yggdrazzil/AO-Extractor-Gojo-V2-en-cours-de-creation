import { RFP, Prospect } from '../types';

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'analyse d'appels d'offres (AO) pour des missions de consulting IT.
Ta tâche est d'extraire les informations clés suivantes :
- Le nom du client (entreprise qui émet l'AO)
- L'intitulé de la mission
- La localisation
- Le TJM maximum si mentionné (en nombre uniquement, sans le symbole €)
- La date de démarrage : extraire EXACTEMENT la date qui suit immédiatement après "Début souhaité"
- La date de création : extraire EXACTEMENT la date qui suit après "Créé le" (peut être sur la ligne suivante)

INSTRUCTIONS CRITIQUES POUR LES DATES:

1. Date de création:
   - Chercher EXACTEMENT la séquence "Créé le" dans le texte
   - Extraire UNIQUEMENT la date qui suit, même si elle est sur la ligne suivante
   - La date DOIT être au format JJ/MM/AAAA (ex: 26/12/2024)
   - Ne pas modifier le format de la date, la garder telle quelle
   - IMPORTANT: La date est souvent sur une nouvelle ligne après "Créé le"
   - Si la date n'est pas au format JJ/MM/AAAA, renvoyer null

2. Date de démarrage:
   - Chercher la ligne contenant exactement "Début souhaité"
   - Extraire UNIQUEMENT la date qui suit immédiatement (ex: "06/01/2025")
   - Ne pas modifier le format de la date, la garder telle quelle
   - Ne pas extraire d'autres dates du texte

3. Règles strictes:
   - Ne JAMAIS reformater les dates
   - Renvoyer les dates EXACTEMENT comme elles apparaissent dans le texte
   - Si une date n'est pas trouvée, renvoyer null
   - Ne JAMAIS inventer de dates
   - Ne JAMAIS utiliser d'autres dates du texte que celles qui suivent exactement "Créé le" et "Début souhaité"

Exemple de réponse JSON attendue:
{
  "client": "Client confidentiel",
  "mission": "Consultant organisation senior",
  "location": "Lille",
  "maxRate": null,
  "startDate": "06/01/2025",
  "createdAt": "21/12/2024"
}`;

const PROSPECT_SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'analyse de profils de candidats pour des missions de consulting IT.
Ta tâche est d'extraire les informations clés suivantes à partir des informations textuelles fournies :
- Disponibilité : quand le candidat est disponible
- TJM/Salaire : le tarif journalier ou salaire en euros (nombre uniquement)
- Résidence : où habite le candidat
- Mobilité : capacité de déplacement du candidat
- Téléphone : numéro de téléphone mobile français (06, 07, +33)
- Email : adresse email du candidat

RÈGLES STRICTES:
- Analyser UNIQUEMENT le texte principal fourni
- Si une information n'est pas trouvée, renvoyer null
- Ne JAMAIS utiliser "À définir", "Non trouvé" ou similaire
- Pour téléphone: uniquement numéros mobiles français
- Pour email: format valide avec @

Exemple de réponse JSON:
{
  "availability": "Immédiatement",
  "dailyRate": 650,
  "residence": "Paris",
  "mobility": "France entière",
  "phone": "06 12 34 56 78",
  "email": "candidat@email.com"
}

Ta tâche est d'extraire les informations clés suivantes à partir des informations textuelles fournies :
- Disponibilité : quand le candidat est disponible
- TJM/Salaire : le tarif journalier ou salaire en euros (nombre uniquement)
- Résidence : où habite le candidat
- Mobilité : capacité de déplacement du candidat
- Téléphone : numéro de téléphone mobile français (06, 07, +33)
- Email : adresse email du candidat

RÈGLES STRICTES:
- Analyser UNIQUEMENT le texte principal fourni
- Si une information n'est pas trouvée, renvoyer exactement "-" (un tiret)
- Ne JAMAIS utiliser "À définir", "Non trouvé", null ou similaire
- Pour téléphone: uniquement numéros mobiles français, sinon "-"
- Pour email: format valide avec @, sinon "-"
- Pour TJM: si pas trouvé, renvoyer null (pas de tiret pour les nombres)

Exemple de réponse JSON:
{
  "availability": "Immédiatement",
  "dailyRate": 650,
  "residence": "Paris",
  "mobility": "France entière",
  "phone": "06 12 34 56 78",
  "email": "candidat@email.com"
}

Si une info n'est pas trouvée:
{
  "availability": "-",
  "dailyRate": null,
  "residence": "-",
  "mobility": "-",
  "phone": "-",
  "email": "-"
}`;

export async function analyzeRFP(content: string): Promise<Partial<RFP>> {
  // Essayer d'abord la clé spécifique à l'utilisateur, puis la clé globale
  let apiKey = localStorage.getItem('openai-api-key');
  
  try {
    const { supabase } = await import('../lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const userApiKey = localStorage.getItem(`openai-api-key_${session.user.email}`);
      if (userApiKey) {
        apiKey = userApiKey;
      }
    }
  } catch (error) {
    console.warn('Could not get user session for API key:', error);
  }
  
  if (!apiKey) {
    throw new Error('Veuillez configurer votre clé API OpenAI dans les paramètres');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error("Erreur lors de l'analyse. Vérifiez votre clé API dans les paramètres.");
    }

    const data = await response.json();
    let result;
    try {
      const content = data.choices[0].message.content.replace(/``\`json\n|\n```/g, '');
      result = JSON.parse(content);
    } catch (error) {
      console.error('Erreur de parsing JSON:', data.choices[0].message.content);
      throw new Error("Erreur lors de l'analyse de la réponse");
    }

    const todayFormatted = formatDate(new Date());

    return {
      client: result.client === null ? 'Non spécifié' : result.client,
      mission: result.mission || 'Non spécifié',
      location: result.location || 'Non spécifié',
      maxRate: result.maxRate || null,
      startDate: result.startDate || null,
      createdAt: result.createdAt || todayFormatted
    };
  } catch (error) {
    console.error('Erreur OpenAI:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erreur lors de l'analyse de l'AO");
  }
}

export async function analyzeProspect(content: string, cvContent?: string): Promise<Partial<Prospect>> {
  // Essayer d'abord la clé spécifique à l'utilisateur, puis la clé globale
  let apiKey = localStorage.getItem('openai-api-key');
  
  try {
    const { supabase } = await import('../lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const userApiKey = localStorage.getItem(`openai-api-key_${session.user.email}`);
      if (userApiKey) {
        apiKey = userApiKey;
      }
    }
  } catch (error) {
    console.warn('Could not get user session for API key:', error);
  }
  
  if (!apiKey) {
    throw new Error('Veuillez configurer votre clé API OpenAI dans les paramètres');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: PROSPECT_SYSTEM_PROMPT },
          { role: 'user', content: content }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error("Erreur lors de l'analyse. Vérifiez votre clé API dans les paramètres.");
    }

    const data = await response.json();
    let result;
    try {
      const content = data.choices[0].message.content.replace(/``\`json\n|\n```/g, '');
      result = JSON.parse(content);
    } catch (error) {
      console.error('Erreur de parsing JSON:', data.choices[0].message.content);
      throw new Error("Erreur lors de l'analyse de la réponse");
    }

    // Nettoyer les réponses et forcer null pour les coordonnées manquantes
    return {
      availability: result.availability || '-',
      dailyRate: result.dailyRate || null,
      residence: result.residence || '-',
      mobility: result.mobility || '-',
      phone: result.phone || '-',
      email: result.email || '-'
    };
  } catch (error) {
    console.error('Erreur OpenAI:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erreur lors de l'analyse du profil");
  }
}