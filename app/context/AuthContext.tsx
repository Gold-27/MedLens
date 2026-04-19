import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../services/supabase';
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isGuest = !session?.user;

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    const checkSession = async () => {
      setLoading(true);

      try {
        // Race the session check against a timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);

        if (error) {
          console.error('Session check error:', error);
        }

        setUser(session?.user ?? null);
        setSession(session);
      } catch (error) {
        console.error('Auth initialization error:', error);
        // On timeout/error, set as guest and continue
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log(`[Auth] Event: ${event}`);
      
      setUser(currentSession?.user ?? null);
      setSession(currentSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.signInWithPassword({ email, password });
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
      }
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: displayName,
          }
        }
      });

      if (!error) {
        // Force session update immediately
        const { data: { session: refreshedSession } } = await supabase.auth.getSession();
        if (refreshedSession) {
          setSession(refreshedSession);
          setUser(refreshedSession.user);
        } else if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
        }
      }

      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google Auth...');
      const redirectUrl = AuthSession.makeRedirectUri({});
      console.log('AuthSession Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Supabase OAuth Error:', error);
        return { error };
      }

      if (data?.url) {
        console.log('Opening browser for Google Login...');
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        console.log('WebBrowser result:', res.type);

        if (res.type === 'success' && res.url) {
          console.log('Login successful, parsing tokens...');
          const paramsStr = res.url.split('#')[1] || res.url.split('?')[1];
          if (paramsStr) {
            const searchParams = new URLSearchParams(paramsStr.replace(/\?/g, '&'));
            const access_token = searchParams.get('access_token');
            const refresh_token = searchParams.get('refresh_token');

            if (access_token && refresh_token) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (sessionError) {
                console.error('Session setting error:', sessionError);
                return { error: sessionError };
              }
              console.log('Session established successfully!');
            }
          }
        } else if (res.type === 'cancel' || res.type === 'dismiss') {
          console.log('User cancelled the sign-in flow.');
          return { error: new Error('User cancelled sign-in') };
        }
      }
      return { error: null };
    } catch (error) {
      console.error('Global Google sign in error:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const getToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  };

  const value = {
    user,
    session,
    isGuest,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};