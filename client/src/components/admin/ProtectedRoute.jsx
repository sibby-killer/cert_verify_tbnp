import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/admin/login" replace />;
  }

  // If authenticated, render the matched child route
  return <Outlet />;
};

export default ProtectedRoute;
