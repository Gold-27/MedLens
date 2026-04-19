import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userToken?: string;
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Auth] Supabase not configured — cannot validate token');
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    // Create a user-scoped client to validate the JWT
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('[Auth] Invalid token or session error:', error?.message);
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }

    console.log(`[Auth] User validated: ${user.id} (${user.email || 'no email'})`);
    req.userId = user.id;
    req.userToken = token;
    next();
  } catch (error: any) {
    console.error('[Auth] Middleware error:', error.message);
    return res.status(500).json({ error: 'Authentication check failed' });
  }
};
