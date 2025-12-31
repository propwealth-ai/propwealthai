import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Building2, 
  DollarSign, 
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Bot,
  GraduationCap,
  Users
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { 
      title: t('dashboard.analyzeNewDeal') || 'Analyze New Deal', 
      desc: t('dashboard.analyzeNewDealDesc') || 'Run AI analysis on a property', 
      icon: Bot,
      path: '/analyzer',
      color: 'text-blue-400'
    },
    { 
      title: t('dashboard.continueLearning') || 'Continue Learning', 
      desc: t('dashboard.continueLearningDesc') || 'PropWealth Academy', 
      icon: GraduationCap,
      path: '/academy',
      color: 'text-purple-400'
    },
    { 
      title: t('dashboard.inviteTeam') || 'Invite Team Member', 
      desc: t('dashboard.inviteTeamDesc') || 'Grow your power team', 
      icon: Users,
      path: '/team',
      color: 'text-primary'
    },
  ];

  const stats = [
    {
      label: t('dashboard.netWorth'),
      value: '$1,250,000',
      change: '+12.5%',
      isPositive: true,
      icon: TrendingUp,
    },
    {
      label: t('dashboard.totalProperties'),
      value: '8',
      change: '+2',
      isPositive: true,
      icon: Building2,
    },
    {
      label: t('dashboard.monthlyIncome'),
      value: '$18,500',
      change: '+8.3%',
      isPositive: true,
      icon: DollarSign,
    },
    {
      label: t('dashboard.cashOnCash'),
      value: '14.2%',
      change: '+1.8%',
      isPositive: true,
      icon: Percent,
    },
  ];

  const recentProperties = [
    { 
      address: '123 Investment Ave, Miami FL',
      status: 'acquired',
      value: '$425,000',
      roi: '15.2%'
    },
    { 
      address: '456 Cashflow St, Austin TX',
      status: 'analyzing',
      value: '$315,000',
      roi: '12.8%'
    },
    { 
      address: '789 Equity Blvd, Denver CO',
      status: 'new',
      value: '$275,000',
      roi: '11.5%'
    },
  ];

  const statusColors = {
    new: 'bg-blue-500/20 text-blue-400',
    analyzing: 'bg-yellow-500/20 text-yellow-400',
    acquired: 'bg-primary/20 text-primary',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-3xl font-bold text-foreground">
            {t('dashboard.welcome')}, {profile?.full_name?.split(' ')[0] || 'Investor'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your portfolio today.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/properties')}
          className="btn-premium text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('dashboard.addProperty') || 'Add Property'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={stat.label} 
            className="stat-card animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className={cn("flex items-center gap-2 mt-4", isRTL && "flex-row-reverse")}>
              {stat.isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-primary" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-destructive" />
              )}
              <span className={stat.isPositive ? "text-primary text-sm" : "text-destructive text-sm"}>
                {stat.change}
              </span>
              <span className="text-muted-foreground text-sm">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h2 className={cn("text-xl font-semibold text-foreground mb-6", isRTL && "text-right")}>
          {t('dashboard.recentActivity')}
        </h2>
        <div className="space-y-4">
          {recentProperties.map((property, index) => (
            <div 
              key={index}
              onClick={() => navigate('/properties')}
              className={cn(
                "flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer",
                isRTL && "flex-row-reverse"
              )}
            >
              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <p className="font-medium text-foreground">{property.address}</p>
                  <span className={cn(
                    "inline-block px-2 py-1 rounded text-xs mt-1",
                    statusColors[property.status as keyof typeof statusColors]
                  )}>
                    {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className={cn("text-right", isRTL && "text-left")}>
                <p className="font-semibold text-foreground">{property.value}</p>
                <p className="text-sm text-primary">ROI: {property.roi}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <div 
            key={index}
            onClick={() => navigate(action.path)}
            className="glass-card p-6 cursor-pointer hover:border-primary/30 transition-all group"
          >
            <div className={cn("w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4", action.color)}>
              <action.icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {action.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{action.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
