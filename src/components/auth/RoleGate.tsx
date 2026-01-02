import React from 'react';
import { useRBAC, AppRole, RolePermissions } from '@/hooks/useRBAC';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requiredPermission?: keyof RolePermissions;
  fallback?: React.ReactNode;
  showNothing?: boolean;
}

/**
 * RoleGate - Conditionally renders children based on user role/permissions
 * 
 * Usage:
 * <RoleGate allowedRoles={['owner', 'admin']}>
 *   <AdminPanel />
 * </RoleGate>
 * 
 * <RoleGate requiredPermission="financial">
 *   <FinancialData />
 * </RoleGate>
 */
const RoleGate: React.FC<RoleGateProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  fallback = null,
  showNothing = true,
}) => {
  const { hasAnyRole, canView, loading } = useRBAC();

  // While loading, show nothing or fallback
  if (loading) {
    return showNothing ? null : <>{fallback}</>;
  }

  // Check role-based access
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return showNothing ? null : <>{fallback}</>;
  }

  // Check permission-based access
  if (requiredPermission && !canView(requiredPermission)) {
    return showNothing ? null : <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGate;
