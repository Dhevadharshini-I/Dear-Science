import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/profile';

const SYNTHETIC_DOMAIN = 'dearscience.local';

function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${SYNTHETIC_DOMAIN}`;
}

function emailToUsername(email: string): string {
  const atIdx = email.lastIndexOf(`@${SYNTHETIC_DOMAIN}`);
  if (atIdx > 0) {
    return email.slice(0, atIdx);
  }
  return email.split('@')[0] ?? '';
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signUp: (username: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: { full_name?: string; avatar_url?: string | null }) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, full_name, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setProfile(data as UserProfile);
    } else {
      // Profile doesn't exist yet — create it with the name from signup metadata
      const { data: userData } = await supabase.auth.getUser();
      const fullName = userData.user?.user_metadata?.full_name ?? '';
      const username = userData.user?.user_metadata?.username ?? '';
      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert({ id: userId, full_name: fullName, username })
        .select('id, username, full_name, avatar_url, created_at, updated_at')
        .maybeSingle();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return;
      }
      if (newProfile) {
        setProfile(newProfile as UserProfile);
      }
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (username: string, password: string) => {
    const email = usernameToEmail(username.trim());
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: translateAuthError(error.message) };
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (username: string, password: string, fullName: string) => {
    const cleanUsername = username.trim().toLowerCase();
    const email = usernameToEmail(cleanUsername);

    // Check if username is already taken
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (existing) {
      return { error: 'That username is already taken. Please choose another.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, username: cleanUsername },
      },
    });

    if (error) {
      return { error: translateAuthError(error.message) };
    }

    // Create the profile row
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({ id: data.user.id, full_name: fullName, username: cleanUsername });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  const updateProfile = useCallback(
    async (updates: { full_name?: string; avatar_url?: string | null }) => {
      if (!session?.user) {
        return { error: 'You must be logged in to update your profile.' };
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (error) {
        return { error: 'Could not save your changes. Please try again.' };
      }

      await fetchProfile(session.user.id);
      return { error: null };
    },
    [session, fetchProfile],
  );

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function getDisplayName(user: User | null, profile: UserProfile | null): string {
  return profile?.full_name || (user?.email ? emailToUsername(user.email) : 'User');
}

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect username or password. Please try again.';
  }
  if (lower.includes('user already registered')) {
    return 'That username is already taken. Please choose another.';
  }
  if (lower.includes('password') && lower.includes('at least')) {
    return 'Password must be at least 8 characters with an uppercase letter, lowercase letter, number, and special character.';
  }
  if (lower.includes('email')) {
    return 'Please enter a valid username.';
  }
  return message;
}
