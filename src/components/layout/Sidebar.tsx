import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Brain, 
  GraduationCap, 
  Users, 
  Settings, 
  Building2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  History,
  ShieldCheck,
  Award
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRBAC, RolePermissions } from '@/hooks/useRBAC';
import { useAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';

const LOGO_URL = "https://ik.imagekit.io/PropWealthAI/PropWealth%20AI%20/logo%20ofial%20propwealth%202%20-%20Copia%20(1)%20-%20Copia.png?updatedAt=1767203215713";
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  requiredPermission?: keyof RolePermissions;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { t, isRTL } = useLanguage();
  const { signOut, profile } = useAuth();
  const { canView, role } = useRBAC();
  const { isAdmin } = useAdmin();
  const location = useLocation();

  const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
    { icon: Brain, label: t('nav.analyzer'), path: '/analyzer' },
    { icon: History, label: t('nav.analysisHistory'), path: '/analysis-history' },
    { icon: Building2, label: t('nav.properties'), path: '/properties', requiredPermission: 'physical' },
    { icon: BarChart3, label: t('nav.analytics') || 'Analytics', path: '/analytics', requiredPermission: 'analytics' },
    { icon: GraduationCap, label: t('nav.academy'), path: '/academy' },
    { icon: Users, label: t('nav.team'), path: '/team', requiredPermission: 'team' },
    { icon: Settings, label: t('nav.settings'), path: '/settings', requiredPermission: 'settings' },
  ];

  // Filter nav items based on permissions
  const visibleNavItems = navItems.filter(item => {
    if (!item.requiredPermission) return true;
    return canView(item.requiredPermission);
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside 
      className={cn(
        "fixed top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-20" : "w-64",
        isRTL ? "right-0 border-l border-r-0" : "left-0"
      )}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img 
              src={LOGO_URL} 
              alt="PropWealth AI Logo" 
              className="w-10 h-10 rounded-xl object-contain"
            />
            <div>
              <h1 className="font-bold text-foreground text-lg">PropWealth AI</h1>
              <p className="text-xs text-muted-foreground">AI Investment OS</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img 
            src={LOGO_URL} 
            alt="PropWealth AI Logo" 
            className="w-10 h-10 rounded-xl object-contain mx-auto"
          />
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "absolute top-20 -right-3 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-primary hover:border-primary transition-colors",
          isRTL && "right-auto -left-3"
        )}
      >
        {collapsed ? (
          isRTL ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
        ) : (
          isRTL ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              "nav-item",
              isActive(item.path) && "active",
              collapsed && "justify-center px-3"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
        
        {/* Affiliate Link - Only visible to influencers */}
        {profile?.is_influencer && (
          <NavLink
            to="/affiliate"
            className={cn(
              "nav-item mt-4 border-t border-sidebar-border pt-4",
              isActive('/affiliate') && "active",
              collapsed && "justify-center px-3"
            )}
          >
            <Award className="w-5 h-5 flex-shrink-0 text-primary" />
            {!collapsed && <span className="truncate text-primary">{t('nav.affiliate')}</span>}
          </NavLink>
        )}
        
        {/* Admin Link - Only visible to admins */}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={cn(
              "nav-item",
              profile?.is_influencer ? "" : "mt-4 border-t border-sidebar-border pt-4",
              isActive('/admin') && "active",
              collapsed && "justify-center px-3"
            )}
          >
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-warning" />
            {!collapsed && <span className="truncate text-warning">{t('nav.admin')}</span>}
          </NavLink>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && profile && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-sm font-medium text-foreground">
                {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile.full_name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t(`role.${role}`)}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          className={cn(
            "nav-item w-full text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-3"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
