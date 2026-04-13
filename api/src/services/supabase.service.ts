import { createClient } from '@supabase/supabase-js';

export interface CabinetItem {
  id: string;
  user_id: string;
  drug_name: string;
  drug_key: string;
  source: string;
  created_at: string;
  updated_at: string;
  last_accessed_at?: string;
  deleted_at?: string;
}

export interface SaveCabinetItemParams {
  userId: string;
  drugName: string;
  drugKey: string;
  source?: string;
}

export class SupabaseService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are not set');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async saveCabinetItem(params: SaveCabinetItemParams): Promise<CabinetItem> {
    const { userId, drugName, drugKey, source = 'OpenFDA' } = params;

    const { data, error } = await this.supabase
      .from('cabinet_items')
      .upsert({
        user_id: userId,
        drug_name: drugName,
        drug_key: drugKey,
        source,
        last_accessed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,drug_key',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase saveCabinetItem error:', error);
      throw new Error(`Failed to save cabinet item: ${error.message}`);
    }

    return data as CabinetItem;
  }

  async getCabinetItems(userId: string): Promise<CabinetItem[]> {
    const { data, error } = await this.supabase
      .from('cabinet_items')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getCabinetItems error:', error);
      throw new Error(`Failed to fetch cabinet items: ${error.message}`);
    }

    return data as CabinetItem[];
  }

  async deleteCabinetItem(userId: string, drugKey: string): Promise<void> {
    const { error } = await this.supabase
      .from('cabinet_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('drug_key', drugKey);

    if (error) {
      console.error('Supabase deleteCabinetItem error:', error);
      throw new Error(`Failed to delete cabinet item: ${error.message}`);
    }
  }

  async updateLastAccessed(userId: string, drugKey: string): Promise<void> {
    const { error } = await this.supabase
      .from('cabinet_items')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('drug_key', drugKey);

    if (error) {
      console.error('Supabase updateLastAccessed error:', error);
      // Non-critical error, just log
    }
  }
}