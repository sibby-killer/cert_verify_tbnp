import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * ProtectedRoute — guards all admin pages.
 *
 * Behaviour:
 * - While AuthProvider is restoring session (loading === true), show a
 *   full-page spinner so the user doesn't see a flash redirect to /login.
 * - If the session could not be restored (user === null), redirect to login.
 * - Otherwise render child routes via <Outlet />.
 */
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A6B]" />
          <p className="text-slate-400 text-sm font-medium">Restoring session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
