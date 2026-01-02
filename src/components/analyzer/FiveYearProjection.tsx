import { TrendingUp, Wallet, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, calculate5YearProjection } from '@/types/deepScan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { Badge } from '@/components/ui/badge';

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
    year: `${t('analyzer.projection.year')} ${p.year}`,
    yearNum: p.year,
    propertyValue: p.propertyValue,
    loanBalance: p.loanBalance,
    equity: p.equity,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-2xl">
          <p className="text-sm font-bold text-foreground mb-3">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 text-sm py-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-bold tabular-nums" style={{ color: entry.color }}>
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
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-emerald-500/5">
        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
          <CardTitle className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span>{t('analyzer.projection.title')}</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {t('analyzer.projection.legend')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {t('analyzer.projection.subtitle')}
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
            <div className={cn("flex items-center gap-2 mb-3", isRTL && "flex-row-reverse")}>
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {t('analyzer.projection.futureValue')}
              </span>
            </div>
            <p className="text-3xl font-black text-primary">
              {formatCurrency(projection.projections[5].propertyValue, currency)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="text-primary font-semibold">+{formatCurrency(projection.totalAppreciation, currency)}</span> {t('analyzer.projection.appreciation')}
            </p>
          </div>
          
          <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20">
            <div className={cn("flex items-center gap-2 mb-3", isRTL && "flex-row-reverse")}>
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {t('analyzer.projection.equityBuilt')}
              </span>
            </div>
            <p className="text-3xl font-black text-emerald-500">
              {formatCurrency(projection.finalEquity, currency)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('analyzer.projection.from')} <span className="font-semibold">{formatCurrency(projection.initialEquity, currency)}</span> {t('analyzer.projection.downPayment')}
            </p>
          </div>
        </div>

        {/* Chart with Legend */}
        <div className="mb-4">
          <div className={cn("flex items-center justify-center gap-8 mb-4", isRTL && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <div className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/30" />
              <span className="text-sm font-medium text-foreground">
                {t('analyzer.projection.propertyValue')}
              </span>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30" />
              <span className="text-sm font-medium text-foreground">
                {t('analyzer.projection.equity')}
              </span>
            </div>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <div className="w-4 h-1 bg-destructive rounded-full opacity-60" />
              <span className="text-sm font-medium text-muted-foreground">
                {t('analyzer.projection.loanBalance')}
              </span>
            </div>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-52 w-full bg-secondary/20 rounded-xl p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
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
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="propertyValue"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorValue)"
                name={t('analyzer.projection.propertyValue')}
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="hsl(142, 71%, 45%)"
                fillOpacity={1}
                fill="url(#colorEquity)"
                name={t('analyzer.projection.equity')}
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="loanBalance"
                stroke="hsl(var(--destructive))"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                name={t('analyzer.projection.loanBalance')}
                opacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Year-by-Year Timeline */}
        <div className="mt-8 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-4">
            {t('analyzer.projection.yearByYear')}
          </p>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary via-emerald-500 to-emerald-600 rounded-full" />
            
            {projection.projections.slice(1).map((p, index) => (
              <div 
                key={p.year}
                className={cn(
                  "relative flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-secondary/50 transition-colors ml-2",
                  isRTL && "flex-row-reverse"
                )}
              >
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-0 w-4 h-4 rounded-full border-2 border-primary bg-background z-10",
                  index === 4 && "border-emerald-500 bg-emerald-500"
                )} />
                
                <div className={cn("flex items-center gap-3 flex-1 ml-6", isRTL && "flex-row-reverse mr-6 ml-0")}>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                    index === 4 
                      ? "bg-emerald-500/20 text-emerald-500" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {p.year}
                  </div>
                  <div className={cn("flex-1", isRTL && "text-right")}>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(p.propertyValue, currency)}
                    </span>
                  </div>
                </div>
                
                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                  <ChevronRight className="w-4 h-4 text-emerald-500" />
                  <span className={cn(
                    "text-sm font-bold tabular-nums",
                    index === 4 ? "text-emerald-500 text-base" : "text-primary"
                  )}>
                    {formatCurrency(p.equity, currency)}
                  </span>
                  {index === 4 && (
                    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 ml-2">
                      {t('analyzer.projection.equity')}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic mt-6 p-3 bg-secondary/30 rounded-lg">
          {t('analyzer.projection.disclaimer')}
        </p>
      </CardContent>
    </Card>
  );
};

export default FiveYearProjection;