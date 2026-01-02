import React, { useState, useEffect } from 'react';
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
  Users,
  BarChart3
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import RoadToMillionCard from '@/components/dashboard/RoadToMillionCard';

const Dashboard: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [portfolioMetrics, setPortfolioMetrics] = useState({
    netWorth: 0,
    propertyCount: 0,
    monthlyIncome: 0,
    cashOnCash: 0,
  });

  useEffect(() => {
    if (profile?.team_id) {
      fetchPortfolioMetrics();
    }
  }, [profile?.team_id]);

  const fetchPortfolioMetrics = async () => {
    const { data: properties } = await supabase
      .from('properties')
      .select('*');

    if (properties && properties.length > 0) {
      const totalValue = properties.reduce((sum, p) => sum + (p.current_value || p.purchase_price || 0), 0);
      const totalInvested = properties.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
      const equity = totalValue - totalInvested;
      const monthlyRent = properties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0);
      const monthlyExpenses = properties.reduce((sum, p) => sum + (p.monthly_expenses || (p.monthly_rent || 0) * 0.35), 0);
      const monthlyCashflow = monthlyRent - monthlyExpenses;
      const downPayment = totalInvested * 0.25;
      const cashOnCash = downPayment > 0 ? ((monthlyCashflow * 12) / downPayment) * 100 : 0;

      setPortfolioMetrics({
        netWorth: totalValue,
        propertyCount: properties.length,
        monthlyIncome: monthlyCashflow,
        cashOnCash,
      });
    }
  };

  const quickActions = [
    { 
      title: t('dashboard.analyzeNewDeal') || 'Analyze New Deal', 
      desc: t('dashboard.analyzeNewDealDesc') || 'Run AI analysis on a property', 
      icon: Bot,
      path: '/analyzer',
      color: 'text-blue-400'
    },
    { 
      title: 'Portfolio Analytics', 
      desc: 'View charts and trends', 
      icon: BarChart3,
      path: '/analytics',
      color: 'text-primary'
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
      color: 'text-yellow-400'
    },
  ];

  const stats = [
    {
      label: t('dashboard.netWorth'),
      value: `$${portfolioMetrics.netWorth.toLocaleString()}`,
      change: '+12.5%',
      isPositive: true,
      icon: TrendingUp,
    },
    {
      label: t('dashboard.totalProperties'),
      value: portfolioMetrics.propertyCount.toString(),
      change: `${portfolioMetrics.propertyCount > 0 ? '+' : ''}${portfolioMetrics.propertyCount}`,
      isPositive: true,
      icon: Building2,
    },
    {
      label: t('dashboard.monthlyIncome'),
      value: `$${portfolioMetrics.monthlyIncome.toLocaleString()}`,
      change: '+8.3%',
      isPositive: portfolioMetrics.monthlyIncome >= 0,
      icon: DollarSign,
    },
    {
      label: t('dashboard.cashOnCash'),
      value: `${portfolioMetrics.cashOnCash.toFixed(1)}%`,
      change: '+1.8%',
      isPositive: portfolioMetrics.cashOnCash >= 0,
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
    <div className="space-y-6 sm:space-y-8 animate-fade-in px-2 sm:px-0">
      {/* Welcome Section */}
      <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t('dashboard.welcome')}, {profile?.full_name?.split(' ')[0] || 'Investor'}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Here's what's happening with your portfolio today.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/properties')}
          className="btn-premium text-primary-foreground gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {t('dashboard.addProperty') || 'Add Property'}
        </Button>
      </div>

      {/* Road to $1M Card */}
      <RoadToMillionCard currentNetWorth={portfolioMetrics.netWorth} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <div 
            key={stat.label} 
            className="stat-card animate-fade-in p-3 sm:p-6"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
              </div>
            </div>
            <div className={cn("flex items-center gap-1 sm:gap-2 mt-2 sm:mt-4", isRTL && "flex-row-reverse")}>
              {stat.isPositive ? (
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              ) : (
                <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
              )}
              <span className={cn("text-xs sm:text-sm", stat.isPositive ? "text-primary" : "text-destructive")}>
                {stat.change}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-4 sm:p-6">
        <h2 className={cn("text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6", isRTL && "text-right")}>
          {t('dashboard.recentActivity')}
        </h2>
        <div className="space-y-3 sm:space-y-4">
          {recentProperties.map((property, index) => (
            <div 
              key={index}
              onClick={() => navigate('/properties')}
              className={cn(
                "flex items-center justify-between p-3 sm:p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer gap-3",
                isRTL && "flex-row-reverse"
              )}
            >
              <div className={cn("flex items-center gap-3 sm:gap-4 min-w-0 flex-1", isRTL && "flex-row-reverse")}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className={cn("min-w-0", isRTL ? "text-right" : "")}>
                  <p className="font-medium text-foreground text-sm sm:text-base truncate">{property.address}</p>
                  <span className={cn(
                    "inline-block px-2 py-0.5 sm:py-1 rounded text-xs mt-1",
                    statusColors[property.status as keyof typeof statusColors]
                  )}>
                    {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className={cn("text-right flex-shrink-0", isRTL && "text-left")}>
                <p className="font-semibold text-foreground text-sm sm:text-base">{property.value}</p>
                <p className="text-xs sm:text-sm text-primary">ROI: {property.roi}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {quickActions.map((action, index) => (
          <div 
            key={index}
            onClick={() => navigate(action.path)}
            className="glass-card p-4 sm:p-6 cursor-pointer hover:border-primary/30 transition-all group"
          >
            <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4", action.color)}>
              <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base">
              {action.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{action.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
