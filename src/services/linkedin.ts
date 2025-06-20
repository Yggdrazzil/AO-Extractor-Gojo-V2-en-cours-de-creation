import { supabase } from '../lib/supabase';

export interface LinkedInLink {
  id: string;
  rfp_id: string;
  url: string;
  created_at: string;
}

// Fonction pour vérifier et créer la table si nécessaire
async function ensureLinkedInTableExists(): Promise<boolean> {
  try {
    // Tester si la table existe en essayant une requête simple
    const { error } = await supabase
      .from('linkedin_links')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('Table linkedin_links does not exist or is not accessible:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking linkedin_links table:', error);
    return false;
  }
}

// Créer la table via une requête SQL directe
async function createLinkedInTable(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Créer la table linkedin_links si elle n'existe pas
        CREATE TABLE IF NOT EXISTS linkedin_links (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          rfp_id uuid NOT NULL,
          url text NOT NULL,
          created_at timestamptz DEFAULT now()
        );

        -- Ajouter la contrainte de clé étrangère si elle n'existe pas
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'linkedin_links_rfp_id_fkey'
          ) THEN
            ALTER TABLE linkedin_links 
            ADD CONSTRAINT linkedin_links_rfp_id_fkey 
            FOREIGN KEY (rfp_id) REFERENCES rfps(id) ON DELETE CASCADE;
          END IF;
        END $$;

        -- Activer RLS
        ALTER TABLE linkedin_links ENABLE ROW LEVEL SECURITY;

        -- Supprimer les politiques existantes
        DROP POLICY IF EXISTS "linkedin_links_policy" ON linkedin_links;

        -- Créer une politique simple pour les utilisateurs authentifiés
        CREATE POLICY "linkedin_links_policy"
          ON linkedin_links
          FOR ALL
          TO authenticated
          USING (auth.uid() IS NOT NULL)
          WITH CHECK (auth.uid() IS NOT NULL);

        -- Créer un index pour les performances
        CREATE INDEX IF NOT EXISTS idx_linkedin_links_rfp_id ON linkedin_links(rfp_id);
      `
    });

    if (error) {
      console.error('Error creating linkedin_links table:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createLinkedInTable:', error);
    return false;
  }
}

export async function fetchLinkedInLinks(rfpId: string): Promise<LinkedInLink[]> {
  try {
    // Vérifier la session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    // Vérifier que la table existe
    const tableExists = await ensureLinkedInTableExists();
    if (!tableExists) {
      console.log('Table does not exist, attempting to create it...');
      const created = await createLinkedInTable();
      if (!created) {
        throw new Error('Impossible de créer la table linkedin_links. Contactez l\'administrateur.');
      }
    }

    const { data, error } = await supabase
      .from('linkedin_links')
      .select('*')
      .eq('rfp_id', rfpId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching LinkedIn links:', error);
      throw new Error('Erreur lors du chargement des liens LinkedIn');
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchLinkedInLinks:', error);
    throw error;
  }
}

export async function addLinkedInLinks(rfpId: string, urls: string[]): Promise<LinkedInLink[]> {
  try {
    // Vérifier la session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    // Vérifier que la table existe
    const tableExists = await ensureLinkedInTableExists();
    if (!tableExists) {
      const created = await createLinkedInTable();
      if (!created) {
        throw new Error('Impossible de créer la table linkedin_links. Contactez l\'administrateur.');
      }
    }

    const { data, error } = await supabase
      .from('linkedin_links')
      .insert(
        urls.map(url => ({
          rfp_id: rfpId,
          url: url.trim()
        }))
      )
      .select();

    if (error) {
      console.error('Error adding LinkedIn links:', error);
      throw new Error('Erreur lors de l\'ajout des liens LinkedIn');
    }

    return data || [];
  } catch (error) {
    console.error('Error in addLinkedInLinks:', error);
    throw error;
  }
}

export async function deleteLinkedInLink(id: string): Promise<void> {
  try {
    // Vérifier la session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    const { error } = await supabase
      .from('linkedin_links')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting LinkedIn link:', error);
      throw new Error('Erreur lors de la suppression du lien');
    }
  } catch (error) {
    console.error('Error in deleteLinkedInLink:', error);
    throw error;
  }
}

export async function getLinkedInLinkCounts(): Promise<Map<string, number>> {
  try {
    // Vérifier la session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new Map();
    }

    // Vérifier que la table existe
    const tableExists = await ensureLinkedInTableExists();
    if (!tableExists) {
      return new Map();
    }

    const { data, error } = await supabase
      .from('linkedin_links')
      .select('rfp_id');

    if (error) {
      console.error('Error fetching LinkedIn link counts:', error);
      return new Map();
    }

    const counts = new Map<string, number>();
    (data || []).forEach((link) => {
      const count = counts.get(link.rfp_id) || 0;
      counts.set(link.rfp_id, count + 1);
    });

    return counts;
  } catch (error) {
    console.error('Error in getLinkedInLinkCounts:', error);
    return new Map();
  }
}