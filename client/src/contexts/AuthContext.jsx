import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { setAccessToken } from '../services/admin.api.js';

export const AuthContext = createContext(null);

// Dedicated axios instance for auth — no interceptors that could loop
const authAxios = axios.create({ withCredentials: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, _setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  // ── Schedule silent refresh 1 minute before token expiry (14min interval) ─
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      silentRefresh();
    }, 14 * 60 * 1000); // 14 minutes
  }, []);

  const silentRefresh = useCallback(async () => {
    try {
      const res = await authAxios.post('/api/v1/auth/refresh');
      const { accessToken: newToken, user: newUser } = res.data.data;
      setAccessToken(newToken);   // sync axios client
      setUser(newUser);
      _setToken(newToken);
      scheduleRefresh();
    } catch {
      // Refresh token expired — user must log in again
      setAccessToken(null);       // clear axios client
      _setToken(null);
      setUser(null);
    }
  }, [scheduleRefresh]);

  // ── On mount: try to restore session via refresh cookie ───────────────────
  useEffect(() => {
    silentRefresh().finally(() => setLoading(false));
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await authAxios.post('/api/v1/auth/login', { username, password });
    const { accessToken: token, user: loggedInUser } = res.data.data;
    setAccessToken(token);    // sync axios client
    _setToken(token);
    setUser(loggedInUser);
    scheduleRefresh();
    return loggedInUser;
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    try {
      await authAxios.post('/api/v1/auth/logout');
    } catch {
      // Best-effort — always clear local state
    }
    setAccessToken(null);     // clear axios client
    _setToken(null);
    setUser(null);
    window.location.href = '/admin/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, silentRefresh }}>
      {children}
    </AuthContext.Provider>
  );
}
