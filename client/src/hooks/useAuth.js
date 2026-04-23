import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';

/**
 * useAuth — returns the real authentication context.
 * Replaces the previous one-line stub that always returned isAuthenticated: true.
 *
 * Available: { user, accessToken, loading, login, logout, silentRefresh }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>. Check that main.jsx wraps the app.');
  }
  return context;
};
