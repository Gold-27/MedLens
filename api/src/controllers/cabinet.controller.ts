import { Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Creates a Supabase client scoped to the authenticated user's JWT
// This ensures RLS policies apply correctly — the user can only see their own data
const getUserScopedClient = (userToken: string) => {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  });
};

export const getCabinetItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getUserScopedClient(req.userToken!);

    const { data, error } = await supabase
      .from('cabinet_items')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Cabinet] Fetch error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch cabinet items', message: error.message });
    }

    return res.json({ items: data || [], count: (data || []).length });
  } catch (error: any) {
    console.error('[Cabinet] getCabinetItems error:', error.message);
    return res.status(500).json({ error: 'Unexpected error fetching cabinet' });
  }
};

export const saveCabinetItem = async (req: AuthenticatedRequest, res: Response) => {
  const { drug_name, drug_key } = req.body;

  if (!drug_name || !drug_key) {
    return res.status(400).json({ error: 'drug_name and drug_key are required' });
  }

  try {
    const supabase = getUserScopedClient(req.userToken!);

    const { data, error } = await supabase
      .from('cabinet_items')
      .upsert(
        [{ user_id: req.userId, drug_name, drug_key, source: 'OpenFDA' }],
        { onConflict: 'user_id,drug_key' }
      )
      .select()
      .single();

    if (error) {
      console.error('[Cabinet] Save error:', error.message);
      return res.status(500).json({ error: 'Failed to save medication', message: error.message });
    }

    return res.json({ success: true, item: data });
  } catch (error: any) {
    console.error('[Cabinet] saveCabinetItem error:', error.message);
    return res.status(500).json({ error: 'Unexpected error saving medication' });
  }
};

export const deleteCabinetItem = async (req: AuthenticatedRequest, res: Response) => {
  const { drugKey } = req.params;

  if (!drugKey) {
    return res.status(400).json({ error: 'drugKey is required' });
  }

  try {
    const supabase = getUserScopedClient(req.userToken!);

    const { error } = await supabase
      .from('cabinet_items')
      .update({ deleted_at: new Date().toISOString() })
      .match({ user_id: req.userId, drug_key: drugKey });

    if (error) {
      console.error('[Cabinet] Delete error:', error.message);
      return res.status(500).json({ error: 'Failed to remove medication', message: error.message });
    }

    return res.json({ success: true, message: `${drugKey} removed from cabinet` });
  } catch (error: any) {
    console.error('[Cabinet] deleteCabinetItem error:', error.message);
    return res.status(500).json({ error: 'Unexpected error removing medication' });
  }
};
