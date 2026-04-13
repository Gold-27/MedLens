import { Config } from '../config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(
  Config.SUPABASE.URL,
  Config.SUPABASE.ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Helper functions
export const auth = supabase.auth;