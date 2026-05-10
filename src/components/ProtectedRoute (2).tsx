import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireDriver?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requireDriver = false 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page if not logged in
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireDriver && !profile?.isDriver && !profile?.isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  if (requireAdmin && !profile?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
