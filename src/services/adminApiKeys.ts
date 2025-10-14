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
    console.log('🔍 Starting saveAdminApiKey...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('❌ Error getting user:', userError);
      throw userError;
    }

    if (!user) {
      console.error('❌ No user found');
      throw new Error('User not authenticated');
    }

    console.log('✅ User found:', user.email, 'ID:', user.id);

    const admin = await isAdmin();
    console.log('🔍 Is admin?', admin);

    if (!admin) {
      throw new Error('Only admins can save shared API keys');
    }

    console.log('🔍 Checking for existing API key...');
    const { data: existing, error: selectError } = await supabase
      .from('admin_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (selectError) {
      console.error('❌ Error selecting existing key:', selectError);
      throw selectError;
    }

    console.log('🔍 Existing key:', existing ? `found (${existing.id})` : 'not found');

    if (existing) {
      console.log('🔄 Updating existing API key...');
      const { error: updateError } = await supabase
        .from('admin_api_keys')
        .update({ api_key: apiKey, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (updateError) {
        console.error('❌ Error updating API key:', updateError);
        throw updateError;
      }
      console.log('✅ API key updated successfully');
    } else {
      console.log('➕ Inserting new API key...');
      const { error: insertError } = await supabase
        .from('admin_api_keys')
        .insert([{ user_id: user.id, api_key: apiKey }]);

      if (insertError) {
        console.error('❌ Error inserting API key:', insertError);
        console.error('❌ Error details:', JSON.stringify(insertError, null, 2));
        throw insertError;
      }
      console.log('✅ API key inserted successfully');
    }

    localStorage.setItem('openai-api-key', apiKey);
    console.log('✅ Admin API key saved successfully');
  } catch (error) {
    console.error('❌ Error saving admin API key:', error);
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
