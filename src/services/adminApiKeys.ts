import { supabase } from '../lib/supabase';

const ADMIN_EMAILS = [
  'etienne.poulain@hito-digital.com',
  'benoit.civel@hito-digital.com',
  'vincent.ientile@hito-digital.com'
];

export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return false;

    return ADMIN_EMAILS.includes(user.email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function saveAdminApiKey(apiKey: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const admin = await isAdmin();
    if (!admin) {
      throw new Error('Only admins can save shared API keys');
    }

    const { data: existing } = await supabase
      .from('admin_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('admin_api_keys')
        .update({ api_key: apiKey, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('admin_api_keys')
        .insert([{ user_id: user.id, api_key: apiKey }]);

      if (error) throw error;
    }

    localStorage.setItem('openai-api-key', apiKey);
    console.log('✅ Admin API key saved successfully');
  } catch (error) {
    console.error('Error saving admin API key:', error);
    throw error;
  }
}

export async function loadAdminApiKey(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = await isAdmin();
    if (!admin) {
      return localStorage.getItem('openai-api-key');
    }

    const localKey = localStorage.getItem('openai-api-key');
    if (localKey) {
      console.log('✅ Using cached admin API key from localStorage');
      return localKey;
    }

    const { data } = await supabase
      .from('admin_api_keys')
      .select('api_key')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.api_key) {
      localStorage.setItem('openai-api-key', data.api_key);
      console.log('✅ Admin API key loaded from database');
      return data.api_key;
    }

    return null;
  } catch (error) {
    console.error('Error loading admin API key:', error);
    return localStorage.getItem('openai-api-key');
  }
}
