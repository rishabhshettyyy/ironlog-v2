/* ══════════════════════════════════════════════
   client/src/context/AuthContext.jsx
   Provides auth state (user, token) + helpers
   (login, logout, updateUser) to the whole app.
   Author: Rishabh
══════════════════════════════════════════════ */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('ironlog_user')); }
    catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ironlog_token') || null);

  /* Persist auth to localStorage */
  const persist = useCallback((newToken, newUser) => {
    localStorage.setItem('ironlog_token', newToken);
    localStorage.setItem('ironlog_user',  JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const register = useCallback(async (formData) => {
    const { data } = await authApi.register(formData);
    persist(data.token, data.user);
    return data.user;
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem('ironlog_token');
    localStorage.removeItem('ironlog_user');
    setToken(null);
    setUser(null);
  }, []);

  /* Call after profile update to keep local state in sync */
  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('ironlog_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
