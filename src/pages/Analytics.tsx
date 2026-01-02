import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart as PieChartIcon, 
  BarChart3,
  Building2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import ExportPDFButton from '@/components/analytics/ExportPDFButton';
import RoadToMillionCard from '@/components/dashboard/RoadToMillionCard';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface Property {
  id: string;
  address: string;
  city: string | null;
  property_type: string | null;
  purchase_price: number | null;
  current_value: number | null;
  monthly_rent: number | null;
  monthly_expenses?: number | null;
  status: string;
  created_at: string;
}

const COLORS = ['hsl(160, 84%, 39%)', 'hsl(217, 91%, 60%)', 'hsl(280, 87%, 65%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

const Analytics: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const chartsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.team_id) {
      fetchProperties();
    }
  }, [profile?.team_id]);

  const fetchProperties = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: true });

    if (data) {
      setProperties(data as Property[]);
    }
    setLoading(false);
  };

  // Calculate portfolio metrics
  const totalValue = properties.reduce((sum, p) => sum + (p.current_value || p.purchase_price || 0), 0);
  const totalInvested = properties.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
  const totalEquity = totalValue - totalInvested;
  const totalMonthlyRent = properties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0);
  const totalMonthlyExpenses = properties.reduce((sum, p) => sum + (p.monthly_expenses || (p.monthly_rent || 0) * 0.35), 0);
  const totalMonthlyCashflow = totalMonthlyRent - totalMonthlyExpenses;
  const averageROI = totalInvested > 0 ? ((totalMonthlyCashflow * 12) / (totalInvested * 0.25)) * 100 : 0;

  // Prepare chart data
  const cashflowProjection = Array.from({ length: 12 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() + i);
    const growth = 1 + (i * 0.005); // 0.5% monthly growth assumption
    return {
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      cashflow: Math.round(totalMonthlyCashflow * growth),
      expenses: Math.round(totalMonthlyExpenses * (1 + i * 0.002)),
      income: Math.round(totalMonthlyRent * growth)
    };
  });

  // Property type distribution
  const typeDistribution = properties.reduce((acc, p) => {
    const type = p.property_type || 'Other';
    acc[type] = (acc[type] || 0) + (p.current_value || p.purchase_price || 0);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeDistribution).map(([name, value]) => ({
    name,
    value
  }));

  // ROI trend data (mock historical data)
  const roiTrend = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    return {
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      roi: averageROI * (0.85 + (i * 0.03)),
      target: averageROI * 0.9
    };
  });

  // Property performance data
  const propertyPerformance = properties.slice(0, 5).map(p => {
    const monthlyRent = p.monthly_rent || 0;
    const monthlyExpenses = p.monthly_expenses || monthlyRent * 0.35;
    const cashflow = monthlyRent - monthlyExpenses;
    return {
      name: p.address.substring(0, 15) + '...',
      cashflow,
      rent: monthlyRent
    };
  });

  const stats = [
    {
      label: 'Portfolio Value',
      value: `$${totalValue.toLocaleString()}`,
      change: `+$${totalEquity.toLocaleString()}`,
      isPositive: totalEquity >= 0,
      icon: TrendingUp
    },
    {
      label: 'Monthly Cashflow',
      value: `$${totalMonthlyCashflow.toLocaleString()}`,
      change: `${averageROI.toFixed(1)}% ROI`,
      isPositive: true,
      icon: DollarSign
    },
    {
      label: 'Total Properties',
      value: properties.length.toString(),
      change: properties.filter(p => p.status === 'acquired').length + ' acquired',
      isPositive: true,
      icon: Building2
    },
    {
      label: 'Avg Cap Rate',
      value: `${(properties.length > 0 ? 
        properties.reduce((sum, p) => {
          const price = p.purchase_price || 1;
          const rent = p.monthly_rent || 0;
          const expenses = p.monthly_expenses || rent * 0.35;
          return sum + (((rent - expenses) * 12) / price) * 100;
        }, 0) / properties.length : 0).toFixed(1)}%`,
      change: 'Portfolio avg',
      isPositive: true,
      icon: BarChart3
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 rounded-xl bg-gradient-primary animate-pulse-glow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in px-2 sm:px-0">
      {/* Header */}
      <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className={isRTL ? "text-right" : ""}>
          <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse justify-end")}>
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('analytics.title') || 'Portfolio Analytics'}</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('analytics.subtitle') || 'Track your portfolio performance and growth'}
          </p>
        </div>
        <ExportPDFButton 
          targetRef={chartsRef} 
          fileName="propwealth-analytics"
          portfolioData={{
            totalValue,
            totalCashflow: totalMonthlyCashflow,
            propertyCount: properties.length,
            averageROI
          }}
        />
      </div>

      {/* Road to $1M Card */}
      <RoadToMillionCard currentNetWorth={totalValue} />

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
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid - Wrapped for PDF export */}
      <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Cashflow Projection */}
        <div className="glass-card p-4 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            12-Month Cashflow Projection
          </h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowProjection}>
                <defs>
                  <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 18%)" />
                <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={10} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={10} tickFormatter={(v) => `$${(v/1000)}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(222, 47%, 8%)', 
                    border: '1px solid hsl(217, 33%, 18%)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="cashflow" 
                  stroke="hsl(160, 84%, 39%)" 
                  fill="url(#colorCashflow)" 
                  strokeWidth={2}
                  name="Cashflow"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Diversification */}
        <div className="glass-card p-4 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm sm:text-base">
            <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Portfolio Diversification
          </h3>
          <div className="h-48 sm:h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(222, 47%, 8%)', 
                      border: '1px solid hsl(217, 33%, 18%)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Add properties to see diversification
              </div>
            )}
          </div>
        </div>

        {/* ROI Trend */}
        <div className="glass-card p-4 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            ROI Trend (6 Months)
          </h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roiTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 18%)" />
                <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={10} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={10} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(222, 47%, 8%)', 
                    border: '1px solid hsl(217, 33%, 18%)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                />
                <Line 
                  type="monotone" 
                  dataKey="roi" 
                  stroke="hsl(160, 84%, 39%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(160, 84%, 39%)', strokeWidth: 2 }}
                  name="ROI"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="hsl(38, 92%, 50%)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Property Performance */}
        <div className="glass-card p-4 sm:p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Top Properties by Cashflow
          </h3>
          <div className="h-48 sm:h-64">
            {propertyPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertyPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 18%)" />
                  <XAxis type="number" stroke="hsl(215, 20%, 55%)" fontSize={10} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={9} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(222, 47%, 8%)', 
                      border: '1px solid hsl(217, 33%, 18%)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="cashflow" fill="hsl(160, 84%, 39%)" radius={[0, 4, 4, 0]} name="Cashflow" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Add properties to see performance
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Income vs Expenses */}
      <div className="glass-card p-4 sm:p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm sm:text-base">
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Income vs Expenses Projection
        </h3>
        <div className="h-56 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashflowProjection}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 18%)" />
              <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={10} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={10} tickFormatter={(v) => `$${(v/1000)}k`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(222, 47%, 8%)', 
                  border: '1px solid hsl(217, 33%, 18%)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="income" fill="hsl(160, 84%, 39%)" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
