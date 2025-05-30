import { RFP } from '../types';

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

    return {
      client: result.client === null ? 'Non spécifié' : result.client,
      mission: result.mission || 'Non spécifié',
      location: result.location || 'Non spécifié',
      maxRate: result.maxRate || null,
      startDate: result.startDate || null,
      createdAt: result.createdAt || null
    };
  } catch (error) {
    console.error('Erreur OpenAI:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erreur lors de l'analyse de l'AO");
  }
}