import React from 'react';
import { X, Building2, TrendingUp, DollarSign, Percent, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Property {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  property_type: string | null;
  purchase_price: number | null;
  current_value: number | null;
  monthly_rent: number | null;
  monthly_expenses?: number | null;
  status: string;
  image_url?: string | null;
}

interface PropertyComparisonProps {
  properties: Property[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveProperty: (id: string) => void;
  isRTL?: boolean;
}

const PropertyComparison: React.FC<PropertyComparisonProps> = ({
  properties,
  isOpen,
  onClose,
  onRemoveProperty,
  isRTL = false
}) => {
  if (properties.length === 0) return null;

  // Calculate metrics for each property
  const metrics = properties.map(property => {
    const purchasePrice = property.purchase_price || 0;
    const currentValue = property.current_value || purchasePrice;
    const monthlyRent = property.monthly_rent || 0;
    const monthlyExpenses = property.monthly_expenses || (monthlyRent * 0.35);
    const annualRent = monthlyRent * 12;
    const annualExpenses = monthlyExpenses * 12;
    const noi = annualRent - annualExpenses;
    const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
    const cashOnCash = purchasePrice > 0 ? ((monthlyRent - monthlyExpenses) * 12 / (purchasePrice * 0.25)) * 100 : 0;
    const onePercentRule = purchasePrice > 0 ? (monthlyRent / purchasePrice) * 100 : 0;
    const equity = currentValue - purchasePrice;
    const grossYield = purchasePrice > 0 ? (annualRent / purchasePrice) * 100 : 0;
    const monthlyCashflow = monthlyRent - monthlyExpenses;

    return {
      property,
      purchasePrice,
      currentValue,
      monthlyRent,
      monthlyExpenses,
      noi,
      capRate,
      cashOnCash,
      onePercentRule,
      equity,
      grossYield,
      monthlyCashflow
    };
  });

  // Find best values for highlighting
  const bestCapRate = Math.max(...metrics.map(m => m.capRate));
  const bestCashOnCash = Math.max(...metrics.map(m => m.cashOnCash));
  const bestOnePercent = Math.max(...metrics.map(m => m.onePercentRule));
  const bestCashflow = Math.max(...metrics.map(m => m.monthlyCashflow));
  const bestEquity = Math.max(...metrics.map(m => m.equity));

  const MetricRow = ({ 
    label, 
    values, 
    format = 'currency',
    bestValue
  }: { 
    label: string; 
    values: number[]; 
    format?: 'currency' | 'percent' | 'number';
    bestValue?: number;
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 py-3 border-b border-border/50 items-center">
      <span className="text-muted-foreground text-sm font-medium col-span-full sm:col-span-1">{label}</span>
      {values.map((value, index) => {
        const isBest = bestValue !== undefined && value === bestValue && value > 0;
        let displayValue = '';
        if (format === 'currency') {
          displayValue = `$${value.toLocaleString()}`;
        } else if (format === 'percent') {
          displayValue = `${value.toFixed(2)}%`;
        } else {
          displayValue = value.toLocaleString();
        }

        return (
          <div 
            key={index}
            className={cn(
              "text-foreground font-semibold text-sm sm:text-base flex items-center gap-1",
              isBest && "text-primary"
            )}
          >
            {displayValue}
            {isBest && <CheckCircle2 className="w-4 h-4 text-primary" />}
          </div>
        );
      })}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] xl:max-w-6xl bg-card border-border max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Compare Properties ({properties.length})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Property Headers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
              <div className="hidden sm:block"></div>
              {metrics.map(({ property }) => (
                <div key={property.id} className="bg-secondary/50 rounded-lg p-3 sm:p-4 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 h-6 w-6"
                    onClick={() => onRemoveProperty(property.id)}
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  {property.image_url ? (
                    <img 
                      src={property.image_url} 
                      alt={property.address}
                      className="w-full h-16 sm:h-20 object-cover rounded-lg mb-2 sm:mb-3"
                    />
                  ) : (
                    <div className="w-full h-16 sm:h-20 bg-secondary rounded-lg mb-2 sm:mb-3 flex items-center justify-center">
                      <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                    </div>
                  )}
                  <h3 className="font-semibold text-foreground text-xs sm:text-sm truncate">{property.address}</h3>
                  <p className="text-xs text-muted-foreground">{property.city}, {property.state}</p>
                </div>
              ))}
            </div>

            {/* Financial Overview */}
            <div className="glass-card p-3 sm:p-4">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Financial Overview
              </h4>
              <MetricRow label="Purchase Price" values={metrics.map(m => m.purchasePrice)} format="currency" />
              <MetricRow label="Current Value" values={metrics.map(m => m.currentValue)} format="currency" />
              <MetricRow label="Monthly Rent" values={metrics.map(m => m.monthlyRent)} format="currency" />
              <MetricRow label="Monthly Expenses" values={metrics.map(m => m.monthlyExpenses)} format="currency" />
              <MetricRow label="Monthly Cashflow" values={metrics.map(m => m.monthlyCashflow)} format="currency" bestValue={bestCashflow} />
              <MetricRow label="Equity Gain" values={metrics.map(m => m.equity)} format="currency" bestValue={bestEquity} />
            </div>

            {/* Performance Metrics */}
            <div className="glass-card p-3 sm:p-4">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Percent className="w-4 h-4 text-primary" />
                Performance Metrics
              </h4>
              <MetricRow label="Cap Rate" values={metrics.map(m => m.capRate)} format="percent" bestValue={bestCapRate} />
              <MetricRow label="Cash-on-Cash" values={metrics.map(m => m.cashOnCash)} format="percent" bestValue={bestCashOnCash} />
              <MetricRow label="1% Rule" values={metrics.map(m => m.onePercentRule)} format="percent" bestValue={bestOnePercent} />
              <MetricRow label="Gross Yield" values={metrics.map(m => m.grossYield)} format="percent" />
              <MetricRow label="Annual NOI" values={metrics.map(m => m.noi)} format="currency" />
            </div>

            {/* Verdict */}
            <div className="glass-card p-3 sm:p-4">
              <h4 className="font-semibold text-foreground mb-4">Investment Verdict</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                <div className="hidden sm:block"></div>
                {metrics.map(({ property, capRate, onePercentRule, cashOnCash }) => {
                  const score = (
                    (capRate >= 8 ? 1 : 0) +
                    (onePercentRule >= 1 ? 1 : 0) +
                    (cashOnCash >= 10 ? 1 : 0)
                  );
                  const verdict = score >= 2 ? 'Strong Buy' : score === 1 ? 'Consider' : 'Review';
                  const verdictColor = score >= 2 ? 'text-primary' : score === 1 ? 'text-yellow-400' : 'text-destructive';

                  return (
                    <div key={property.id} className="text-center p-3 sm:p-4 bg-secondary/50 rounded-lg">
                      <p className={cn("text-lg sm:text-xl font-bold", verdictColor)}>{verdict}</p>
                      <p className="text-xs text-muted-foreground mt-1">{score}/3 criteria met</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyComparison;
