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
    console.warn(`[Auth] Missing or invalid Authorization header for ${req.url}`);
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(/\s+/)[1];

  if (!token) {
    console.warn(`[Auth] Token missing from Authorization header for ${req.url}`);
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Auth] Supabase configuration missing from environment variables');
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    // Create a singleton-style client for verification
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Validate the token specifically
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error(`[Auth] Token validation failed for ${req.url}:`, error?.message || 'No user found');
      return res.status(401).json({ 
        error: 'Invalid or expired session. Please sign in again.',
        details: error?.message
      });
    }

    console.log(`[Auth] Success: ${user.id} accessed ${req.url}`);
    req.userId = user.id;
    req.userToken = token;
    next();
  } catch (error: any) {
    console.error('[Auth] Internal middleware error:', error.message);
    return res.status(500).json({ error: 'Authentication check failed' });
  }
};
