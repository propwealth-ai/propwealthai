import { useState } from 'react';
import { ChevronDown, Building, Wallet, Wrench, Shield, FileText, Zap, Circle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { OpExBreakdown as OpExBreakdownType, formatCurrency, calculateOpExBreakdown } from '@/types/deepScan';
import { Badge } from '@/components/ui/badge';

interface OpExBreakdownProps {
  opexBreakdown?: OpExBreakdownType;
  totalOpex: number;
  monthlyRent: number;
  purchasePrice: number;
  currency: string;
}

const OpExBreakdown = ({
  opexBreakdown,
  totalOpex,
  monthlyRent,
  purchasePrice,
  currency,
}: OpExBreakdownProps) => {
  const { t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Use provided breakdown or calculate from industry standards
  const breakdown = opexBreakdown || calculateOpExBreakdown(monthlyRent, purchasePrice);
  
  const totalFromBreakdown = Object.values(breakdown).reduce((sum, val) => sum + (val || 0), 0);
  const monthlyTotal = totalOpex || totalFromBreakdown;

  const expenseItems = [
    { 
      key: 'property_taxes',
      label: t('analyzer.opex.propertyTaxes'),
      value: breakdown.property_taxes,
      icon: FileText,
      percent: '1.5%',
      description: t('analyzer.opex.propertyTaxesDesc'),
      color: 'text-orange-400'
    },
    { 
      key: 'insurance',
      label: t('analyzer.opex.insurance'),
      value: breakdown.insurance,
      icon: Shield,
      percent: '0.5%',
      description: t('analyzer.opex.insuranceDesc'),
      color: 'text-blue-400'
    },
    { 
      key: 'maintenance',
      label: t('analyzer.opex.maintenance'),
      value: breakdown.maintenance,
      icon: Wrench,
      percent: '5%',
      description: t('analyzer.opex.maintenanceDesc'),
      color: 'text-amber-400'
    },
    { 
      key: 'property_management',
      label: t('analyzer.opex.propertyManagement'),
      value: breakdown.property_management,
      icon: Building,
      percent: '10%',
      description: t('analyzer.opex.propertyManagementDesc'),
      color: 'text-purple-400'
    },
    { 
      key: 'vacancy',
      label: t('analyzer.opex.vacancy'),
      value: breakdown.vacancy,
      icon: Wallet,
      percent: '6%',
      description: t('analyzer.opex.vacancyDesc'),
      color: 'text-rose-400'
    },
  ];

  // Add optional items if they exist
  if (breakdown.utilities) {
    expenseItems.push({
      key: 'utilities',
      label: t('analyzer.opex.utilities'),
      value: breakdown.utilities,
      icon: Zap,
      percent: '',
      description: '',
      color: 'text-yellow-400'
    });
  }

  if (breakdown.hoa_fees) {
    expenseItems.push({
      key: 'hoa_fees',
      label: t('analyzer.opex.hoaFees'),
      value: breakdown.hoa_fees,
      icon: Building,
      percent: '',
      description: '',
      color: 'text-cyan-400'
    });
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center justify-between p-5 bg-gradient-to-r from-destructive/5 to-destructive/10 rounded-xl border border-destructive/20 hover:border-destructive/40 transition-all cursor-pointer group",
          isRTL && "flex-row-reverse"
        )}>
          <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
            <div className="p-3 rounded-xl bg-destructive/20 group-hover:bg-destructive/30 transition-colors">
              <Wallet className="w-6 h-6 text-destructive" />
            </div>
            <div className={cn("text-left", isRTL && "text-right")}>
              <p className="text-sm text-muted-foreground font-medium">
                {t('analyzer.opex.monthlyExpenses')}
              </p>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(monthlyTotal, currency)}
              </p>
            </div>
          </div>
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <Badge variant="outline" className="text-xs border-destructive/30 text-muted-foreground">
              {t('analyzer.opex.clickToExpand')}
            </Badge>
            <div className={cn(
              "w-8 h-8 rounded-full bg-secondary flex items-center justify-center transition-transform duration-300",
              isOpen && "rotate-180"
            )}>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-3 p-5 bg-secondary/30 rounded-xl border border-border/50 space-y-4 animate-fade-in">
          <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {t('analyzer.opex.industryStandards')}
            </p>
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              {t('analyzer.opex.transparent')}
            </Badge>
          </div>
          
          <div className="space-y-1">
            {expenseItems.map((item) => (
              <div 
                key={item.key}
                className={cn(
                  "flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary/50 transition-colors",
                  isRTL && "flex-row-reverse"
                )}
              >
                <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <Circle className={cn("w-2.5 h-2.5 fill-current", item.color)} />
                  <div className={isRTL ? "text-right" : "text-left"}>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    {item.percent && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">{item.percent}</span> {item.description}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground tabular-nums">
                  {formatCurrency(item.value, currency)}
                </p>
              </div>
            ))}
          </div>
          
          <div className={cn(
            "flex items-center justify-between pt-4 mt-4 border-t-2 border-destructive/30",
            isRTL && "flex-row-reverse"
          )}>
            <p className="text-base font-bold text-foreground">
              {t('analyzer.opex.total')}
            </p>
            <p className="text-xl font-black text-destructive">
              {formatCurrency(monthlyTotal, currency)}
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground italic pt-2 leading-relaxed">
            {t('analyzer.opex.disclaimer')}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default OpExBreakdown;