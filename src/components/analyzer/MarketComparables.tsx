import { MapPin, Calendar, TrendingUp, TrendingDown, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { MarketComparable, formatCurrency } from '@/types/deepScan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MarketComparablesProps {
  comparables?: MarketComparable[];
  suggestedOfferPrice?: number;
  purchasePrice: number;
  currency: string;
}

const MarketComparables = ({
  comparables,
  suggestedOfferPrice,
  purchasePrice,
  currency,
}: MarketComparablesProps) => {
  const { t, isRTL } = useLanguage();

  if (!comparables || comparables.length === 0) {
    return null;
  }

  const avgCompPrice = comparables.reduce((sum, comp) => sum + comp.sale_price, 0) / comparables.length;
  const priceDiff = purchasePrice - avgCompPrice;
  const priceDiffPercent = (priceDiff / avgCompPrice) * 100;
  const isOverpriced = priceDiff > 0;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
          <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Home className="w-5 h-5 text-blue-400" />
            {t('analyzer.comparables.title') || 'Market Comparables (Estimated)'}
          </CardTitle>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
            isOverpriced 
              ? "bg-destructive/10 text-destructive" 
              : "bg-primary/10 text-primary"
          )}>
            {isOverpriced ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {isOverpriced 
              ? `${Math.abs(priceDiffPercent).toFixed(1)}% ${t('analyzer.comparables.aboveMarket') || 'above market'}`
              : `${Math.abs(priceDiffPercent).toFixed(1)}% ${t('analyzer.comparables.belowMarket') || 'below market'}`
            }
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {t('analyzer.comparables.description') || 'Recent sales in the area that justify the AI price assessment'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className={cn("font-medium", isRTL && "text-right")}>
                  {t('analyzer.comparables.address') || 'Address/Location'}
                </TableHead>
                <TableHead className={cn("font-medium", isRTL && "text-right")}>
                  {t('analyzer.comparables.salePrice') || 'Sale Price'}
                </TableHead>
                <TableHead className={cn("font-medium", isRTL && "text-right")}>
                  {t('analyzer.comparables.date') || 'Date'}
                </TableHead>
                <TableHead className={cn("font-medium", isRTL && "text-right")}>
                  {t('analyzer.comparables.differential') || 'Notes'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparables.map((comp, index) => (
                <TableRow key={index} className="hover:bg-secondary/30 transition-colors">
                  <TableCell className={cn("font-medium", isRTL && "text-right")}>
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{comp.address}</span>
                    </div>
                  </TableCell>
                  <TableCell className={cn("font-semibold text-foreground", isRTL && "text-right")}>
                    {formatCurrency(comp.sale_price, currency)}
                  </TableCell>
                  <TableCell className={isRTL ? "text-right" : ""}>
                    <div className={cn("flex items-center gap-1 text-muted-foreground", isRTL && "flex-row-reverse justify-end")}>
                      <Calendar className="w-3 h-3" />
                      <span className="text-sm">{comp.sale_date}</span>
                    </div>
                  </TableCell>
                  <TableCell className={isRTL ? "text-right" : ""}>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                      {comp.differential}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-xs text-muted-foreground mb-1">
                {t('analyzer.comparables.avgComps') || 'Avg. Comp Price'}
              </p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(avgCompPrice, currency)}
              </p>
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-xs text-muted-foreground mb-1">
                {t('analyzer.comparables.askingPrice') || 'Asking Price'}
              </p>
              <p className={cn(
                "text-lg font-bold",
                isOverpriced ? "text-destructive" : "text-primary"
              )}>
                {formatCurrency(purchasePrice, currency)}
              </p>
            </div>
            {suggestedOfferPrice && (
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-xs text-muted-foreground mb-1">
                  {t('analyzer.comparables.suggestedOffer') || 'Suggested Offer'}
                </p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(suggestedOfferPrice, currency)}
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic mt-3">
          {t('analyzer.comparables.disclaimer') || 'Comparables are AI-estimated based on market data patterns. Verify with local MLS data.'}
        </p>
      </CardContent>
    </Card>
  );
};

export default MarketComparables;