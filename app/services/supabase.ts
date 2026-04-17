import { Config } from '../config';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Supabase client
export const supabase = createClient(
  Config.SUPABASE.URL,
  Config.SUPABASE.ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

// Helper functions
export const auth = supabase.auth;