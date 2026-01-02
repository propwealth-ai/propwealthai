import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRBAC, AppRole, RolePermissions } from '@/hooks/useRBAC';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requiredPermission?: keyof RolePermissions;
  fallback?: ReactNode;
  redirectTo?: string;
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  requiredPermission,
  fallback,
  redirectTo,
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, canView, loading: rbacLoading, hasAnyRole } = useRBAC();
  const { t, isRTL } = useLanguage();

  // Show loading state
  if (authLoading || rbacLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 rounded-xl bg-gradient-primary animate-pulse-glow" />
      </div>
    );
  }

  // Check authentication
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role-based access
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        isRTL && "rtl"
      )}>
        <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('auth.accessDenied')}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {t('auth.noPermission')}
        </p>
        <p className="text-sm text-muted-foreground/70 mt-4">
          {t('auth.currentRole')}: <span className="font-medium text-primary">{t(`role.${role}`)}</span>
        </p>
      </div>
    );
  }

  // Check permission-based access
  if (requiredPermission && !canView(requiredPermission)) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        isRTL && "rtl"
      )}>
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('auth.restrictedArea')}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {t('auth.insufficientPermissions')}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
