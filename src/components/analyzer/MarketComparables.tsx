import { MapPin, Calendar, TrendingUp, TrendingDown, Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { MarketComparable, formatCurrency } from '@/types/deepScan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
        <div className={cn("flex items-center justify-between flex-wrap gap-3", isRTL && "flex-row-reverse")}>
          <CardTitle className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Home className="w-5 h-5 text-blue-400" />
            </div>
            <span>{t('analyzer.comparables.title')}</span>
          </CardTitle>
          <Badge 
            variant="outline"
            className={cn(
              "text-sm font-semibold px-3 py-1.5",
              isOverpriced 
                ? "bg-destructive/10 text-destructive border-destructive/30" 
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
            )}
          >
            {isOverpriced ? (
              <TrendingUp className="w-4 h-4 mr-1.5" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1.5" />
            )}
            {Math.abs(priceDiffPercent).toFixed(1)}% {isOverpriced ? t('analyzer.comparables.aboveMarket') : t('analyzer.comparables.belowMarket')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {t('analyzer.comparables.description')}
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead className={cn("font-semibold text-foreground", isRTL && "text-right")}>
                  {t('analyzer.comparables.address')}
                </TableHead>
                <TableHead className={cn("font-semibold text-foreground", isRTL && "text-right")}>
                  {t('analyzer.comparables.salePrice')}
                </TableHead>
                <TableHead className={cn("font-semibold text-foreground", isRTL && "text-right")}>
                  {t('analyzer.comparables.date')}
                </TableHead>
                <TableHead className={cn("font-semibold text-foreground", isRTL && "text-right")}>
                  {t('analyzer.comparables.differential')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparables.map((comp, index) => (
                <TableRow key={index} className="hover:bg-secondary/30 transition-colors">
                  <TableCell className={cn("font-medium", isRTL && "text-right")}>
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                      <div className="p-1.5 rounded-lg bg-secondary">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-sm">{comp.address}</span>
                    </div>
                  </TableCell>
                  <TableCell className={cn("font-bold text-foreground tabular-nums", isRTL && "text-right")}>
                    {formatCurrency(comp.sale_price, currency)}
                  </TableCell>
                  <TableCell className={isRTL ? "text-right" : ""}>
                    <div className={cn("flex items-center gap-1.5 text-muted-foreground", isRTL && "flex-row-reverse justify-end")}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-sm">{comp.sale_date}</span>
                    </div>
                  </TableCell>
                  <TableCell className={isRTL ? "text-right" : ""}>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {comp.differential}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        <div className="mt-6 p-5 bg-gradient-to-r from-secondary/50 to-secondary/30 rounded-xl border border-border/50">
          <div className="grid grid-cols-3 gap-6">
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                {t('analyzer.comparables.avgComps')}
              </p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {formatCurrency(avgCompPrice, currency)}
              </p>
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                {t('analyzer.comparables.askingPrice')}
              </p>
              <p className={cn(
                "text-xl font-bold tabular-nums",
                isOverpriced ? "text-destructive" : "text-emerald-500"
              )}>
                {formatCurrency(purchasePrice, currency)}
              </p>
            </div>
            {suggestedOfferPrice && (
              <div className={cn("relative", isRTL ? "text-right" : "")}>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                  {t('analyzer.comparables.suggestedOffer')}
                </p>
                <p className="text-2xl font-black text-emerald-400 tabular-nums drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                  {formatCurrency(suggestedOfferPrice, currency)}
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic mt-4">
          {t('analyzer.comparables.disclaimer')}
        </p>
      </CardContent>
    </Card>
  );
};

export default MarketComparables;