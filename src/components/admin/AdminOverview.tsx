import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users, UserPlus, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const AdminOverview: React.FC = () => {
  const { t, isRTL } = useLanguage();

  // Fetch all profiles for stats
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch transactions for revenue
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Calculate KPIs
  const totalUsers = profiles?.length || 0;
  const proUsers = profiles?.filter(p => p.plan_type === 'pro').length || 0;
  const activeUsers = profiles?.filter(p => p.payment_status === 'active').length || 0;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newSignups = profiles?.filter(p => new Date(p.created_at) > thirtyDaysAgo).length || 0;
  
  const churned = profiles?.filter(p => p.payment_status === 'cancelled' || p.payment_status === 'past_due').length || 0;
  const churnRate = totalUsers > 0 ? ((churned / totalUsers) * 100).toFixed(1) : '0';
  
  // Calculate MRR (mock: $29/mo for pro users)
  const mrr = proUsers * 29;
  
  // Mock growth data for charts
  const growthData = [
    { month: 'Jul', users: 120, revenue: 3480 },
    { month: 'Aug', users: 145, revenue: 4205 },
    { month: 'Sep', users: 180, revenue: 5220 },
    { month: 'Oct', users: 210, revenue: 6090 },
    { month: 'Nov', users: 250, revenue: 7250 },
    { month: 'Dec', users: 290, revenue: 8410 },
    { month: 'Jan', users: totalUsers || 320, revenue: mrr || 9280 },
  ];

  const planDistribution = [
    { name: 'Free', value: totalUsers - proUsers, color: 'hsl(var(--muted))' },
    { name: 'Pro', value: proUsers, color: 'hsl(var(--primary))' },
  ];

  const kpiCards = [
    {
      title: t('admin.mrr'),
      value: `$${mrr.toLocaleString()}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: t('admin.totalUsers'),
      value: totalUsers.toLocaleString(),
      change: `+${newSignups} this month`,
      trend: 'up',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: t('admin.newSignups'),
      value: newSignups.toLocaleString(),
      change: 'Last 30 days',
      trend: 'up',
      icon: UserPlus,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: t('admin.churnRate'),
      value: `${churnRate}%`,
      change: churned > 0 ? `${churned} users` : 'No churn',
      trend: churned > 0 ? 'down' : 'up',
      icon: TrendingDown,
      color: churned > 0 ? 'text-destructive' : 'text-success',
      bgColor: churned > 0 ? 'bg-destructive/10' : 'bg-success/10',
    },
  ];

  const isLoading = profilesLoading || transactionsLoading;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <div key={index} className="glass-card p-6">
            <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                <p className="text-2xl font-bold text-foreground">{isLoading ? '...' : kpi.value}</p>
                <p className={cn("text-xs mt-1 flex items-center gap-1", kpi.color, isRTL && "flex-row-reverse justify-end")}>
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {kpi.change}
                </p>
              </div>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", kpi.bgColor)}>
                <kpi.icon className={cn("w-6 h-6", kpi.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('admin.userGrowth')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('admin.revenueGrowth')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Plan Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('admin.planDistribution')}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {planDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('admin.recentSignups')}</h3>
          <div className="space-y-3">
            {profiles?.slice(0, 5).map((profile) => (
              <div key={profile.id} className={cn("flex items-center justify-between p-3 bg-secondary/30 rounded-lg", isRTL && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-medium">
                      {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <p className="font-medium text-foreground">{profile.full_name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                </div>
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    profile.plan_type === 'pro' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {profile.plan_type === 'pro' ? 'Pro' : 'Free'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {(!profiles || profiles.length === 0) && (
              <p className="text-muted-foreground text-center py-4">{t('admin.noUsers')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
