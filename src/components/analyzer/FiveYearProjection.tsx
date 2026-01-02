import { TrendingUp, Wallet, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, calculate5YearProjection } from '@/types/deepScan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface FiveYearProjectionProps {
  currentValue: number;
  purchasePrice: number;
  currency: string;
  downPaymentPercent?: number;
  appreciationRate?: number;
}

const FiveYearProjection = ({
  currentValue,
  purchasePrice,
  currency,
  downPaymentPercent = 20,
  appreciationRate = 0.03,
}: FiveYearProjectionProps) => {
  const { t, isRTL } = useLanguage();

  const projection = calculate5YearProjection(
    currentValue,
    purchasePrice,
    downPaymentPercent,
    appreciationRate
  );

  const chartData = projection.projections.map(p => ({
    year: `${t('analyzer.projection.year') || 'Year'} ${p.year}`,
    yearNum: p.year,
    propertyValue: p.propertyValue,
    loanBalance: p.loanBalance,
    equity: p.equity,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium" style={{ color: entry.color }}>
                {formatCurrency(entry.value, currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <TrendingUp className="w-5 h-5 text-primary" />
          {t('analyzer.projection.title') || 'Wealth Projection (5 Years)'}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {t('analyzer.projection.subtitle') || `Conservative ${(appreciationRate * 100).toFixed(0)}% annual appreciation`}
        </p>
      </CardHeader>
      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
            <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('analyzer.projection.futureValue') || 'Future Value (5Y)'}
              </span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(projection.projections[5].propertyValue, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              +{formatCurrency(projection.totalAppreciation, currency)} {t('analyzer.projection.appreciation') || 'appreciation'}
            </p>
          </div>
          
          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <div className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}>
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('analyzer.projection.equityBuilt') || 'Equity Built (5Y)'}
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-500">
              {formatCurrency(projection.finalEquity, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('analyzer.projection.from') || 'From'} {formatCurrency(projection.initialEquity, currency)} {t('analyzer.projection.downPayment') || 'down payment'}
            </p>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="yearNum" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `Y${value}`}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="propertyValue"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorValue)"
                name={t('analyzer.projection.propertyValue') || 'Property Value'}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="hsl(142, 71%, 45%)"
                fillOpacity={1}
                fill="url(#colorEquity)"
                name={t('analyzer.projection.equity') || 'Equity'}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="loanBalance"
                stroke="hsl(var(--destructive))"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                dot={false}
                name={t('analyzer.projection.loanBalance') || 'Loan Balance'}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className={cn("flex items-center justify-center gap-6 mt-4", isRTL && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">
              {t('analyzer.projection.propertyValue') || 'Property Value'}
            </span>
          </div>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">
              {t('analyzer.projection.equity') || 'Equity'}
            </span>
          </div>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <div className="w-3 h-0.5 bg-destructive" style={{ borderStyle: 'dashed' }} />
            <span className="text-xs text-muted-foreground">
              {t('analyzer.projection.loanBalance') || 'Debt'}
            </span>
          </div>
        </div>

        {/* Year-by-Year Breakdown */}
        <div className="mt-6 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
            {t('analyzer.projection.yearByYear') || 'Year-by-Year Breakdown'}
          </p>
          {projection.projections.slice(1).map((p) => (
            <div 
              key={p.year}
              className={cn(
                "flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors",
                isRTL && "flex-row-reverse"
              )}
            >
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {t('analyzer.projection.year') || 'Year'} {p.year}
                </span>
              </div>
              <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(p.propertyValue, currency)}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(p.equity, currency)} {t('analyzer.projection.equity') || 'equity'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground italic mt-4">
          {t('analyzer.projection.disclaimer') || 'Projections assume 20% down payment, 7% interest rate, 30-year term. Actual results may vary.'}
        </p>
      </CardContent>
    </Card>
  );
};

export default FiveYearProjection;