import { useState } from 'react';
import { ChevronDown, Building, Wallet, Wrench, Shield, FileText, Zap } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { OpExBreakdown as OpExBreakdownType, formatCurrency, calculateOpExBreakdown } from '@/types/deepScan';

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
      key: 'property_management',
      label: t('analyzer.opex.propertyManagement') || 'Property Management',
      value: breakdown.property_management,
      icon: Building,
      percent: '10%',
      description: t('analyzer.opex.propertyManagementDesc') || 'of gross rent'
    },
    { 
      key: 'vacancy',
      label: t('analyzer.opex.vacancy') || 'Vacancy Reserve',
      value: breakdown.vacancy,
      icon: Wallet,
      percent: '6%',
      description: t('analyzer.opex.vacancyDesc') || 'of gross rent'
    },
    { 
      key: 'maintenance',
      label: t('analyzer.opex.maintenance') || 'Maintenance & Repairs',
      value: breakdown.maintenance,
      icon: Wrench,
      percent: '5%',
      description: t('analyzer.opex.maintenanceDesc') || 'of gross rent'
    },
    { 
      key: 'insurance',
      label: t('analyzer.opex.insurance') || 'Insurance',
      value: breakdown.insurance,
      icon: Shield,
      percent: '0.5%',
      description: t('analyzer.opex.insuranceDesc') || 'of property value/year'
    },
    { 
      key: 'property_taxes',
      label: t('analyzer.opex.propertyTaxes') || 'Property Taxes',
      value: breakdown.property_taxes,
      icon: FileText,
      percent: '1.5%',
      description: t('analyzer.opex.propertyTaxesDesc') || 'of property value/year'
    },
  ];

  // Add optional items if they exist
  if (breakdown.utilities) {
    expenseItems.push({
      key: 'utilities',
      label: t('analyzer.opex.utilities') || 'Utilities',
      value: breakdown.utilities,
      icon: Zap,
      percent: '',
      description: ''
    });
  }

  if (breakdown.hoa_fees) {
    expenseItems.push({
      key: 'hoa_fees',
      label: t('analyzer.opex.hoaFees') || 'HOA Fees',
      value: breakdown.hoa_fees,
      icon: Building,
      percent: '',
      description: ''
    });
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors cursor-pointer",
          isRTL && "flex-row-reverse"
        )}>
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-lg bg-destructive/10">
              <Wallet className="w-4 h-4 text-destructive" />
            </div>
            <div className={cn("text-left", isRTL && "text-right")}>
              <p className="text-sm text-muted-foreground">
                {t('analyzer.opex.monthlyExpenses') || 'Monthly Operating Expenses'}
              </p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(monthlyTotal, currency)}
              </p>
            </div>
          </div>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">
              {t('analyzer.opex.clickToExpand') || 'Click to expand'}
            </span>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-2 p-4 bg-secondary/30 rounded-lg space-y-3 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {t('analyzer.opex.industryStandards') || 'Industry Standard Estimates'}
            </p>
            <span className="text-xs text-primary px-2 py-1 bg-primary/10 rounded-full">
              {t('analyzer.opex.transparent') || 'Transparent Math'}
            </span>
          </div>
          
          {expenseItems.map((item) => (
            <div 
              key={item.key}
              className={cn(
                "flex items-center justify-between py-2 border-b border-border/50 last:border-0",
                isRTL && "flex-row-reverse"
              )}
            >
              <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <div className={isRTL ? "text-right" : "text-left"}>
                  <p className="text-sm text-foreground">{item.label}</p>
                  {item.percent && (
                    <p className="text-xs text-muted-foreground">
                      {item.percent} {item.description}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(item.value, currency)}
              </p>
            </div>
          ))}
          
          <div className={cn(
            "flex items-center justify-between pt-3 mt-3 border-t border-border",
            isRTL && "flex-row-reverse"
          )}>
            <p className="text-sm font-semibold text-foreground">
              {t('analyzer.opex.total') || 'Total Monthly OpEx'}
            </p>
            <p className="text-lg font-bold text-destructive">
              {formatCurrency(monthlyTotal, currency)}
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground italic pt-2">
            {t('analyzer.opex.disclaimer') || 'These are industry-standard estimates. Actual expenses may vary based on property condition and local market.'}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default OpExBreakdown;