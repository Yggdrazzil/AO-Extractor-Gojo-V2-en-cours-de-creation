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
Ta tâche est d'extraire les informations clés suivantes à partir des informations textuelles fournies sur un candidat :
- Disponibilité : quand le candidat est disponible (ex: "Immédiatement", "Janvier 2025", "2 semaines", etc.)
- TJM (Taux Journalier Moyen) : le tarif journalier du candidat en euros (nombre uniquement, sans le symbole €)
- Résidence : où habite le candidat (ville, région)
- Mobilité : capacité de déplacement du candidat (ex: "France entière", "Région parisienne", "Télétravail uniquement", etc.)
- Téléphone : numéro de téléphone du candidat
- Email : adresse email du candidat

INSTRUCTIONS CRITIQUES:

1. Extraction des données:
   - Extraire UNIQUEMENT les informations explicitement mentionnées dans le texte
   - Si le téléphone ou l'email ne sont pas présents dans le texte principal, indiquer "RECHERCHER_DANS_CV" pour ces champs
   - Pour les autres informations, si elles ne sont pas présentes ou ne sont pas claires, renvoyer null
   - Ne JAMAIS inventer ou déduire d'informations
   - Être précis dans l'extraction des données de contact

2. Format des données:
   - TJM : nombre entier uniquement (ex: 650, pas "650€" ou "650 euros")
   - Téléphone : format exact tel qu'écrit dans le texte
   - Email : adresse email complète et exacte
   - Disponibilité : texte descriptif tel qu'indiqué
   - Résidence : ville ou région mentionnée
   - Mobilité : description de la capacité de déplacement

3. Règles strictes:
   - Si le TJM n'est pas mentionné explicitement, renvoyer null
   - Si les coordonnées ne sont pas présentes dans le texte, renvoyer "RECHERCHER_DANS_CV"
   - Respecter exactement le format des coordonnées tel qu'écrit
   - Ne pas reformater les numéros de téléphone

Exemple de réponse JSON attendue:
{
  "availability": "Immédiatement",
  "dailyRate": 650,
  "residence": "Paris",
  "mobility": "France entière",
  "phone": "RECHERCHER_DANS_CV",
  "email": "RECHERCHER_DANS_CV"
}`;

export async function analyzeRFP(content: string): Promise<Partial<RFP>> {
  const apiKey = localStorage.getItem('openai-api-key');
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
      const content = data.choices[0].message.content.replace(/```json\n|\n```/g, '');
      result = JSON.parse(content);
    } catch (error) {
      console.error('Erreur de parsing JSON:', data.choices[0].message.content);
      throw new Error("Erreur lors de l'analyse de la réponse");
    }

    // Si aucune date de création n'est trouvée, utiliser la date du jour
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

export async function analyzeProspect(content: string): Promise<Partial<Prospect>> {
  const apiKey = localStorage.getItem('openai-api-key');
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
          { role: 'system', content: PROSPECT_SYSTEM_PROMPT },
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
      const content = data.choices[0].message.content.replace(/```json\n|\n```/g, '');
      result = JSON.parse(content);
    } catch (error) {
      console.error('Erreur de parsing JSON:', data.choices[0].message.content);
      throw new Error("Erreur lors de l'analyse de la réponse");
    }

    // Traiter les valeurs spéciales pour les coordonnées
    const processedResult = {
      availability: result.availability || 'À définir',
      dailyRate: result.dailyRate || null,
      residence: result.residence || 'À définir',
      mobility: result.mobility || 'À définir',
      phone: result.phone === 'RECHERCHER_DANS_CV' ? 'À extraire du CV' : (result.phone || 'À définir'),
      email: result.email === 'RECHERCHER_DANS_CV' ? 'À extraire du CV' : (result.email || 'À définir')
    };

    return processedResult;
  } catch (error) {
    console.error('Erreur OpenAI:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erreur lors de l'analyse du profil");
  }
}