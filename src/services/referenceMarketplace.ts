import { supabase } from '../lib/supabase';
import type { ReferenceMarketplace } from '../types';

export async function fetchReferenceMarketplace(): Promise<ReferenceMarketplace[]> {
  const { data, error } = await supabase
    .from('reference_marketplace')
    .select(`
      *,
      sales_rep:sales_reps(id, name, email, code)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addReferenceMarketplace(
  reference: Omit<ReferenceMarketplace, 'id' | 'created_at' | 'sales_rep'>
): Promise<ReferenceMarketplace> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Clean up empty strings to null
  const cleanedReference = {
    ...reference,
    phone: reference.phone || null,
    email: reference.email || null,
    tech_name: reference.tech_name || null,
    created_by: user.id
  };

  const { data, error } = await supabase
    .from('reference_marketplace')
    .insert([cleanedReference])
    .select(`
      *,
      sales_rep:sales_reps(id, name, email, code)
    `)
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error(error.message || 'Failed to create reference');
  }

  return data;
}

export async function updateReferenceMarketplace(
  id: string,
  updates: Partial<Omit<ReferenceMarketplace, 'id' | 'created_at' | 'created_by' | 'sales_rep'>>
): Promise<ReferenceMarketplace> {
  const { data, error } = await supabase
    .from('reference_marketplace')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      sales_rep:sales_reps(id, name, email, code)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReferenceMarketplace(id: string): Promise<void> {
  const { error } = await supabase
    .from('reference_marketplace')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
