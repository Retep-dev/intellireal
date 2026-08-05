import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured) {
      // Real Supabase Auth Flow
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      return data;
    } else {
      const demoUser = {
        id: 'dev-user-001',
        email: email || 'analyst@intellireal.com',
        user_metadata: { full_name: fullName || 'Financial Analyst' },
      };
      localStorage.setItem('intellireal_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      return { user: demoUser };
    }
  };

  const signIn = async (email, password) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } else {
      const demoUser = {
        id: 'dev-user-001',
        email: email || 'analyst@intellireal.com',
        user_metadata: { full_name: 'Financial Analyst' },
      };
      localStorage.setItem('intellireal_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      return { user: demoUser };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStorage.removeItem('intellireal_demo_user');
      setUser(null);
    }
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
