import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { usePermission } from '../hooks/usePermission';
import { NoPermission } from '../components/NoPermission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requirePermission,
}) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const hasPermission = usePermission(requirePermission || '');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requirePermission && !hasPermission) {
    return <NoPermission />;
  }

  return <>{children}</>;
};
