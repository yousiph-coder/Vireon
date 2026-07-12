import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for mock Google Login token first
    const mockToken = localStorage.getItem('token');
    const mockUser = localStorage.getItem('user_name');
    if (mockToken === 'google-oauth-mock-jwt-token-xyz') {
      const mockSession = { access_token: mockToken };
      const mockUserData = { id: 'mock-google-id', email: 'google@mock.com', user_metadata: { full_name: mockUser } };
      setUser(mockUserData);
      setSession(mockSession);
      setLoading(false);
      return;
    }

    // 2. Otherwise use Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session ? session.user : null);
      if (session) {
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user_name', session.user.user_metadata?.full_name || session.user.email.split('@')[0]);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Don't override mock Google Session if it's active
      if (localStorage.getItem('token') === 'google-oauth-mock-jwt-token-xyz') {
        return;
      }
      setSession(session);
      setUser(session ? session.user : null);
      if (session) {
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user_name', session.user.user_metadata?.full_name || session.user.email.split('@')[0]);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user_name');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.user);
      localStorage.setItem('token', data.session.access_token);
      localStorage.setItem('user_name', data.user.user_metadata?.full_name || email.split('@')[0]);
    }
    return { data, error };
  };

  const signup = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });
    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.user);
      localStorage.setItem('token', data.session.access_token);
      localStorage.setItem('user_name', name);
    }
    return { data, error };
  };

  const logout = async () => {
    const mockToken = localStorage.getItem('token');
    if (mockToken === 'google-oauth-mock-jwt-token-xyz') {
      localStorage.removeItem('token');
      localStorage.removeItem('user_name');
      setUser(null);
      setSession(null);
      return;
    }

    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user_name');
    setUser(null);
    setSession(null);
  };

  const googleLogin = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem('token', 'google-oauth-mock-jwt-token-xyz');
        localStorage.setItem('user_name', 'مستخدم جوجل');
        const mockUserData = { id: 'mock-google-id', email: 'google@mock.com', user_metadata: { full_name: 'مستخدم جوجل' } };
        const mockSessionData = { access_token: 'google-oauth-mock-jwt-token-xyz' };
        setUser(mockUserData);
        setSession(mockSessionData);
        resolve(true);
      }, 1100);
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, signup, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
