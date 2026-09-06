import React from 'react';
import { usePermission } from '../hooks/usePermission';

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
  const hasPermission = usePermission(permission);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};
