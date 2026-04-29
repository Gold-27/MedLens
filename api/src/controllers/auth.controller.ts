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

    // 0. Cleanup user data from public tables first to avoid constraint violations
    try {
      console.log(`[Auth] Pre-deleting user data from tables for: ${userId}`);
      
      // Delete from profiles
      const { error: profileError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (profileError) console.warn('[Auth] Failed to delete from profiles:', profileError.message);

      // Delete from cabinet_items
      const { error: cabinetError } = await adminClient
        .from('cabinet_items')
        .delete()
        .eq('user_id', userId);
      if (cabinetError) console.warn('[Auth] Failed to delete from cabinet_items:', cabinetError.message);

      // Delete from support_messages first (since cascade might be missing)
      const { data: conversations } = await adminClient
        .from('support_conversations')
        .select('id')
        .eq('user_id', userId);
      
      if (conversations && conversations.length > 0) {
        const convIds = conversations.map(c => c.id);
        const { error: messagesError } = await adminClient
          .from('support_messages')
          .delete()
          .in('conversation_id', convIds);
        if (messagesError) console.warn('[Auth] Failed to delete from support_messages:', messagesError.message);
      }

      // Delete from support_conversations
      const { error: supportError } = await adminClient
        .from('support_conversations')
        .delete()
        .eq('user_id', userId);
      if (supportError) console.warn('[Auth] Failed to delete from support_conversations:', supportError.message);

      // Delete from recent_searches
      const { error: searchesError } = await adminClient
        .from('recent_searches')
        .delete()
        .eq('user_id', userId);
      if (searchesError) console.warn('[Auth] Failed to delete from recent_searches:', searchesError.message);
      
    } catch (cleanupError: any) {
      console.warn('[Auth] Cleanup error before user deletion:', cleanupError.message);
    }

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
