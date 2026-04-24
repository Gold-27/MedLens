import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Admin client with service role key to manage users
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminClient = supabaseUrl && supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export const deleteAccount = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!adminClient) {
    console.error('[Auth] Admin client not initialized. Missing SUPABASE_SERVICE_ROLE_KEY?');
    return res.status(500).json({ error: 'Server configuration error. Account deletion failed.' });
  }

  try {
    console.log(`[Auth] Attempting to permanently delete user: ${userId}`);

    // 1. Delete user from Supabase Auth (this is permanent and removes from auth.users)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[Auth] Supabase Admin delete error:', deleteError.message);
      return res.status(500).json({ error: `Failed to delete authentication account: ${deleteError.message}` });
    }

    // 2. Note: ON DELETE CASCADE on our tables (profiles, cabinet_items) should handle the rest
    // but we can also manually cleanup if we want to be absolutely sure.
    // However, Supabase Auth deletion is the primary requirement here.

    console.log(`[Auth] User ${userId} successfully removed from auth.users`);
    
    res.json({ 
      success: true, 
      message: 'Account permanently deleted' 
    });
  } catch (error: any) {
    console.error('[Auth] Unexpected error during account deletion:', error.message);
    res.status(500).json({ error: 'Internal server error during account deletion' });
  }
};
