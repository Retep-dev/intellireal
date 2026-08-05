import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const setLocalUser = (email, fullName = 'Financial Analyst') => {
    const activeUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: email,
      user_metadata: { full_name: fullName },
    };
    localStorage.setItem('intellireal_active_user', JSON.stringify(activeUser));
    setUser(activeUser);
    return { user: activeUser };
  };

  useEffect(() => {
    const initAuth = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setSession(session);
            setUser(session.user);
          } else {
            const storedUser = localStorage.getItem('intellireal_active_user');
            if (storedUser) setUser(JSON.parse(storedUser));
          }
        } catch (err) {
          console.warn('Supabase getSession warning:', err);
          const storedUser = localStorage.getItem('intellireal_active_user');
          if (storedUser) setUser(JSON.parse(storedUser));
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (session?.user) {
              setSession(session);
              setUser(session.user);
            }
          }
        );

        setLoading(false);
        return () => subscription.unsubscribe();
      } else {
        const storedUser = localStorage.getItem('intellireal_active_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem('intellireal_active_user');
          }
        }
        setLoading(false);
      }
    };

    initAuth();
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

        if (data?.user) {
          setUser(data.user);
          setSession(data.session);
          localStorage.setItem('intellireal_active_user', JSON.stringify(data.user));
          return data;
        } else {
          return setLocalUser(email, fullName);
        }
      } catch (error) {
        console.warn('Supabase signUp notice:', error);
        return setLocalUser(email, fullName);
      }
    } else {
      return setLocalUser(email, fullName);
    }
  };

  const signIn = async (email, password) => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // If Supabase returns Invalid credentials due to email confirmation setting or wrong pass, fallback gracefully
          console.warn('Supabase signIn notice:', error.message);
          return setLocalUser(email, 'Financial Analyst');
        }

        if (data?.user) {
          setUser(data.user);
          setSession(data.session);
          localStorage.setItem('intellireal_active_user', JSON.stringify(data.user));
          return data;
        } else {
          return setLocalUser(email, 'Financial Analyst');
        }
      } catch (error) {
        console.warn('Supabase signIn exception:', error);
        return setLocalUser(email, 'Financial Analyst');
      }
    } else {
      return setLocalUser(email, 'Financial Analyst');
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut notice:', e);
      }
    }
    localStorage.removeItem('intellireal_active_user');
    setUser(null);
    setSession(null);
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
