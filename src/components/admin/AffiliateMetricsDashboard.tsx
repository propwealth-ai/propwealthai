import React, { useMemo } from 'react';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface ReferralData {
  id: string;
  commission_amount: number;
  status: string;
  created_at: string;
}

interface AffiliateMetricsDashboardProps {
  allReferrals: ReferralData[];
}

const AffiliateMetricsDashboard: React.FC<AffiliateMetricsDashboardProps> = ({ allReferrals }) => {
  const { t, isRTL } = useLanguage();

  // Calculate monthly data for charts
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { month: string; referrals: number; paid: number; pending: number; total: number }>();
    
    // Get last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthMap.set(key, { month: monthName, referrals: 0, paid: 0, pending: 0, total: 0 });
    }

    // Populate with actual data
    allReferrals.forEach(referral => {
      const date = new Date(referral.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthMap.has(key)) {
        const entry = monthMap.get(key)!;
        entry.referrals += 1;
        entry.total += referral.commission_amount;
        if (referral.status === 'paid') {
          entry.paid += referral.commission_amount;
        } else if (referral.status === 'pending') {
          entry.pending += referral.commission_amount;
        }
      }
    });

    return Array.from(monthMap.values());
  }, [allReferrals]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthReferrals = allReferrals.filter(r => new Date(r.created_at) >= thisMonth);
    const lastMonthReferrals = allReferrals.filter(r => {
      const date = new Date(r.created_at);
      return date >= lastMonth && date <= lastMonthEnd;
    });

    const thisMonthCommissions = thisMonthReferrals.reduce((sum, r) => sum + r.commission_amount, 0);
    const lastMonthCommissions = lastMonthReferrals.reduce((sum, r) => sum + r.commission_amount, 0);

    const referralGrowth = lastMonthReferrals.length > 0
      ? ((thisMonthReferrals.length - lastMonthReferrals.length) / lastMonthReferrals.length) * 100
      : thisMonthReferrals.length > 0 ? 100 : 0;

    const commissionGrowth = lastMonthCommissions > 0
      ? ((thisMonthCommissions - lastMonthCommissions) / lastMonthCommissions) * 100
      : thisMonthCommissions > 0 ? 100 : 0;

    return {
      thisMonthReferrals: thisMonthReferrals.length,
      thisMonthCommissions,
      referralGrowth,
      commissionGrowth,
    };
  }, [allReferrals]);

  const chartConfig = {
    referrals: {
      label: t('admin.referrals'),
      color: 'hsl(var(--primary))',
    },
    paid: {
      label: t('admin.paidCommissions'),
      color: 'hsl(var(--success))',
    },
    pending: {
      label: t('admin.pendingCommissions'),
      color: 'hsl(var(--warning))',
    },
  };

  return (
    <div className="space-y-6">
      {/* Growth Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-xs text-muted-foreground">{t('admin.thisMonthReferrals')}</p>
              <p className="text-xl font-bold text-foreground">{stats.thisMonthReferrals}</p>
            </div>
          </div>
          <div className={cn("mt-2 flex items-center gap-1 text-xs", isRTL && "flex-row-reverse justify-end")}>
            <TrendingUp className={cn("w-3 h-3", stats.referralGrowth >= 0 ? "text-success" : "text-destructive rotate-180")} />
            <span className={stats.referralGrowth >= 0 ? "text-success" : "text-destructive"}>
              {stats.referralGrowth >= 0 ? '+' : ''}{stats.referralGrowth.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">{t('admin.vsLastMonth')}</span>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-xs text-muted-foreground">{t('admin.thisMonthCommissions')}</p>
              <p className="text-xl font-bold text-success">${stats.thisMonthCommissions.toFixed(2)}</p>
            </div>
          </div>
          <div className={cn("mt-2 flex items-center gap-1 text-xs", isRTL && "flex-row-reverse justify-end")}>
            <TrendingUp className={cn("w-3 h-3", stats.commissionGrowth >= 0 ? "text-success" : "text-destructive rotate-180")} />
            <span className={stats.commissionGrowth >= 0 ? "text-success" : "text-destructive"}>
              {stats.commissionGrowth >= 0 ? '+' : ''}{stats.commissionGrowth.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">{t('admin.vsLastMonth')}</span>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-xs text-muted-foreground">{t('admin.avgReferralsMonth')}</p>
              <p className="text-xl font-bold text-foreground">
                {(allReferrals.length / Math.max(monthlyData.filter(m => m.referrals > 0).length, 1)).toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-xs text-muted-foreground">{t('admin.avgCommission')}</p>
              <p className="text-xl font-bold text-foreground">
                ${allReferrals.length > 0 
                  ? (allReferrals.reduce((s, r) => s + r.commission_amount, 0) / allReferrals.length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referrals Growth Chart */}
        <div className="glass-card p-6">
          <h3 className={cn("text-lg font-semibold text-foreground mb-4", isRTL && "text-right")}>
            {t('admin.referralsGrowth')}
          </h3>
          <div className="h-64">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="referralsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="referrals"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#referralsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Commissions Chart */}
        <div className="glass-card p-6">
          <h3 className={cn("text-lg font-semibold text-foreground mb-4", isRTL && "text-right")}>
            {t('admin.commissionsGrowth')}
          </h3>
          <div className="h-64">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={(value) => `$${value}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar 
                    dataKey="paid" 
                    name={t('admin.paidCommissions')}
                    fill="hsl(var(--success))" 
                    radius={[4, 4, 0, 0]}
                    stackId="commissions"
                  />
                  <Bar 
                    dataKey="pending" 
                    name={t('admin.pendingCommissions')}
                    fill="hsl(var(--warning))" 
                    radius={[4, 4, 0, 0]}
                    stackId="commissions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateMetricsDashboard;
