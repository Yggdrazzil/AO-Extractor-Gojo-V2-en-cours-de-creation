/**
 * Service pour l'intégration avec l'API Boondmanager
 * TEMPORAIREMENT DÉSACTIVÉ - Mode démonstration uniquement
 */

export interface BoondmanagerNeed {
  id: string;
  title: string;
  client: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Récupère des besoins de démonstration
 * L'intégration réelle Boondmanager sera implémentée ultérieurement
 */
export async function fetchOpenNeeds(): Promise<BoondmanagerNeed[]> {
  console.log('🔍 Fetching demo needs (Boondmanager integration disabled)');
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const demoNeeds: BoondmanagerNeed[] = [
    {
      id: 'demo-1',
      title: 'Développeur Full Stack React/Node.js',
      client: 'TechCorp Solutions',
      description: 'Recherche d\'un développeur expérimenté pour projet e-commerce',
      status: 'En Cours',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-2',
      title: 'Consultant SAP Finance',
      client: 'Global Industries', 
      description: 'Mission de 6 mois pour implémentation module FI/CO',
      status: 'En Cours',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-3',
      title: 'Chef de Projet Digital',
      client: 'Innovation Labs',
      description: 'Pilotage transformation digitale secteur bancaire',
      status: 'En Cours',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-4',
      title: 'Architecte Cloud AWS',
      client: 'CloudFirst Inc',
      description: 'Migration infrastructure vers AWS et formation équipes',
      status: 'En Cours',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  console.log(`✅ Returning ${demoNeeds.length} demo needs`);
  return demoNeeds;
}

/**
 * Test de connexion (toujours réussi en mode démo)
 */
export async function testBoondmanagerConnection(): Promise<boolean> {
  console.log('🧪 Testing demo connection (always successful)');
  await new Promise(resolve => setTimeout(resolve, 200));
  return true;
}

/**
 * Récupère les détails d'un besoin de démonstration
 */
export async function fetchNeedDetails(needId: string): Promise<BoondmanagerNeed | null> {
  console.log(`🔍 Fetching demo need details for: ${needId}`);
  
  const allNeeds = await fetchOpenNeeds();
  return allNeeds.find(need => need.id === needId) || null;
}