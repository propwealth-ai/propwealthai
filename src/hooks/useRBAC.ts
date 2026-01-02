import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'owner' | 'admin' | 'lender' | 'contractor' | 'shark_agent' | 'attorney' | 'inspector' | 'member';

export interface RolePermissions {
  financial: boolean;
  physical: boolean;
  documents: boolean;
  team: boolean;
  settings: boolean;
  analytics: boolean;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  team_id: string;
}

const DEFAULT_PERMISSIONS: RolePermissions = {
  financial: false,
  physical: false,
  documents: false,
  team: false,
  settings: false,
  analytics: false,
};

const ROLE_PERMISSIONS: Record<AppRole, RolePermissions> = {
  owner: { financial: true, physical: true, documents: true, team: true, settings: true, analytics: true },
  admin: { financial: true, physical: true, documents: true, team: true, settings: false, analytics: true },
  lender: { financial: true, physical: false, documents: true, team: false, settings: false, analytics: true },
  contractor: { financial: false, physical: true, documents: false, team: false, settings: false, analytics: false },
  shark_agent: { financial: true, physical: true, documents: true, team: false, settings: false, analytics: false },
  attorney: { financial: false, physical: false, documents: true, team: false, settings: false, analytics: false },
  inspector: { financial: false, physical: true, documents: false, team: false, settings: false, analytics: false },
  member: { financial: false, physical: false, documents: false, team: false, settings: false, analytics: false },
};

export const useRBAC = () => {
  const { user, profile } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.team_id) {
      fetchUserRole();
    } else {
      setLoading(false);
    }
  }, [user, profile?.team_id]);

  const fetchUserRole = async () => {
    if (!user || !profile?.team_id) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('team_id', profile.team_id)
        .maybeSingle();

      if (!error && data) {
        const role = data as UserRole;
        setUserRole(role);
        setPermissions(ROLE_PERMISSIONS[role.role] || DEFAULT_PERMISSIONS);
      } else {
        // Fallback to profile.team_role for backwards compatibility
        const fallbackRole = (profile.team_role as AppRole) || 'member';
        setPermissions(ROLE_PERMISSIONS[fallbackRole] || DEFAULT_PERMISSIONS);
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return userRole?.role === role || profile?.team_role === role;
  };

  const hasAnyRole = (roles: AppRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const isOwner = (): boolean => hasRole('owner');
  const isAdmin = (): boolean => hasAnyRole(['owner', 'admin']);

  const canView = (permission: keyof RolePermissions): boolean => {
    return permissions[permission] === true;
  };

  const role = userRole?.role || (profile?.team_role as AppRole) || 'member';

  return {
    role,
    permissions,
    loading,
    hasRole,
    hasAnyRole,
    isOwner,
    isAdmin,
    canView,
    // Convenience methods
    canViewFinancial: permissions.financial,
    canViewPhysical: permissions.physical,
    canViewDocuments: permissions.documents,
    canManageTeam: permissions.team,
    canAccessSettings: permissions.settings,
    canViewAnalytics: permissions.analytics,
  };
};

export default useRBAC;
