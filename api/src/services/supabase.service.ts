import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface CabinetItem {
  id?: string;
  user_id: string;
  drug_name: string;
  drug_key: string;
  source: string;
  created_at?: string;
}

export class SupabaseService {
  private client: SupabaseClient | null = null;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    // Check if URL is valid (should start with http/https)
    if (url && url.startsWith('http') && key) {
      this.client = createClient(url, key);
    } else {
      console.warn('Supabase configuration is incomplete or invalid. Cabinet features will be disabled or mocked.');
    }
  }

  async getCabinetItems(userId: string): Promise<CabinetItem[]> {
    if (!this.client) {
      console.log('Mock: Returning empty cabinet for guest/unconfigured user');
      return [];
    }

    const { data, error } = await this.client
      .from('cabinet_items')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase get error:', error.message);
      throw new Error(`Failed to fetch cabinet: ${error.message}`);
    }

    return data || [];
  }

  async saveToCabinet(item: CabinetItem): Promise<CabinetItem> {
    if (!this.client) {
      throw new Error('Cabinet cannot be modified without a valid Supabase configuration');
    }

    const { data, error } = await this.client
      .from('cabinet_items')
      .upsert([item], { onConflict: 'user_id,drug_key' })
      .select()
      .single();

    if (error) {
      console.error('Supabase save error:', error.message);
      throw new Error(`Failed to save medication: ${error.message}`);
    }

    return data;
  }

  async removeFromCabinet(userId: string, drugKey: string): Promise<void> {
    if (!this.client) {
      throw new Error('Cabinet cannot be modified without a valid Supabase configuration');
    }

    const { error } = await this.client
      .from('cabinet_items')
      .update({ deleted_at: new Date().toISOString() })
      .match({ user_id: userId, drug_key: drugKey });

    if (error) {
      console.error('Supabase delete error:', error.message);
      throw new Error(`Failed to remove medication: ${error.message}`);
    }
  }
}

export default new SupabaseService();
