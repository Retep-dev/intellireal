import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const setDemoUser = (email, fullName) => {
    const demoUser = {
      id: 'dev-user-001',
      email: email || 'analyst@intellireal.com',
      user_metadata: { full_name: fullName || 'Financial Analyst' },
    };
    localStorage.setItem('intellireal_demo_user', JSON.stringify(demoUser));
    setUser(demoUser);
    return { user: demoUser };
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      // Real Supabase Auth Flow
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch((err) => {
        console.warn('Supabase getSession failed, falling back to local demo check:', err);
        const storedUser = localStorage.getItem('intellireal_demo_user');
        if (storedUser) setUser(JSON.parse(storedUser));
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } else {
      // Local Demo Mode (when Supabase keys aren't added yet)
      const storedUser = localStorage.getItem('intellireal_demo_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('intellireal_demo_user');
        }
      }
      setLoading(false);
    }
  }, []);

  const signUp = async (email, password, fullName) => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn('Supabase signUp error:', error);
        // If the Supabase API key is invalid/unauthorized, fallback to demo mode so user isn't blocked
        if (error.status === 401 || error.message?.toLowerCase().includes('apikey') || error.message?.toLowerCase().includes('api key') || error.code === 'invalid_api_key') {
          console.warn('Invalid Supabase Anon Key detected. Logging in via Demo Mode.');
          return setDemoUser(email, fullName);
        }
        throw error;
      }
    } else {
      return setDemoUser(email, fullName);
    }
  };

  const signIn = async (email, password) => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return data;
      } catch (error) {
        console.warn('Supabase signIn error:', error);
        // If the Supabase API key is invalid/unauthorized, fallback to demo mode so user isn't blocked
        if (error.status === 401 || error.message?.toLowerCase().includes('apikey') || error.message?.toLowerCase().includes('api key') || error.code === 'invalid_api_key') {
          console.warn('Invalid Supabase Anon Key detected. Logging in via Demo Mode.');
          return setDemoUser(email, 'Financial Analyst');
        }
        throw error;
      }
    } else {
      return setDemoUser(email, 'Financial Analyst');
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut failed:', e);
      }
    }
    localStorage.removeItem('intellireal_demo_user');
    setUser(null);
  };

  const value = {
    user,
    session,
    loading,
    isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
