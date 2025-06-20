import { supabase } from '../lib/supabase';

export interface LinkedInLink {
  id: string;
  rfp_id: string;
  url: string;
  created_at: string;
}

export async function fetchLinkedInLinks(rfpId: string): Promise<LinkedInLink[]> {
  try {
    console.log('Fetching LinkedIn links for RFP:', rfpId);

    const { data, error } = await supabase
      .from('linkedin_links')
      .select('*')
      .eq('rfp_id', rfpId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching LinkedIn links:', error);
      throw new Error(`Erreur lors du chargement des liens LinkedIn: ${error.message}`);
    }

    console.log('Successfully fetched LinkedIn links:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error in fetchLinkedInLinks:', error);
    throw error;
  }
}

export async function addLinkedInLinks(rfpId: string, urls: string[]): Promise<LinkedInLink[]> {
  try {
    // Valider les URLs
    const validUrls = urls.filter(url => {
      const trimmedUrl = url.trim();
      return trimmedUrl && (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://'));
    });

    if (validUrls.length === 0) {
      throw new Error('Aucune URL valide fournie');
    }

    console.log('Adding LinkedIn links for RFP:', rfpId, 'URLs:', validUrls.length);

    const { data, error } = await supabase
      .from('linkedin_links')
      .insert(
        validUrls.map(url => ({
          rfp_id: rfpId,
          url: url.trim()
        }))
      )
      .select();

    if (error) {
      console.error('Error adding LinkedIn links:', error);
      throw new Error(`Erreur lors de l'ajout des liens LinkedIn: ${error.message}`);
    }

    console.log('Successfully added LinkedIn links:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error in addLinkedInLinks:', error);
    throw error;
  }
}

export async function deleteLinkedInLink(id: string): Promise<void> {
  try {
    console.log('Deleting LinkedIn link:', id);

    const { error } = await supabase
      .from('linkedin_links')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting LinkedIn link:', error);
      throw new Error(`Erreur lors de la suppression du lien: ${error.message}`);
    }

    console.log('Successfully deleted LinkedIn link');
  } catch (error) {
    console.error('Error in deleteLinkedInLink:', error);
    throw error;
  }
}

export async function getLinkedInLinkCounts(): Promise<Map<string, number>> {
  try {
    console.log('Fetching LinkedIn link counts');

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

    console.log('Successfully fetched link counts for', counts.size, 'RFPs');
    return counts;
  } catch (error) {
    console.error('Error in getLinkedInLinkCounts:', error);
    return new Map();
  }
}