import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set, auth middleware will be disabled');
}

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Skip authentication for health check and autocomplete
  if (req.path === '/health' || req.path === '/api/autocomplete') {
    return next();
  }

  // Allow search and interactions without authentication (guest mode)
  if (req.path === '/api/search' || req.path === '/api/interactions' || req.path === '/api/eli12') {
    return next();
  }

  // For cabinet endpoints, require authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  
  if (!supabase) {
    return res.status(500).json({ error: 'Auth configuration error' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }

    // Attach user to request object
    (req as any).user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};