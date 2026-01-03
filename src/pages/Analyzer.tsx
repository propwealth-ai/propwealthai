import React, { useState, useMemo } from 'react';
import { 
  Brain, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Calculator,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Zap,
  Globe,
  Shield,
  Target,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Hammer,
  Lightbulb,
  BadgeCheck,
  Link,
  PlusCircle,
  Check,
  RefreshCw,
  Database,
  ShieldAlert,
  Info,
  Home
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DeepScanResult, jurisdictionInfo, formatCurrency, ValidationWarning } from '@/types/deepScan';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OpExBreakdown from '@/components/analyzer/OpExBreakdown';
import MarketComparables from '@/components/analyzer/MarketComparables';
import FiveYearProjection from '@/components/analyzer/FiveYearProjection';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AnalysisResultWithCache extends DeepScanResult {
  cached?: boolean;
  cache_age_minutes?: number;
}

const Analyzer = () => {
  const { t, isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const [url, setUrl] = useState('');
  const [address, setAddress] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResultWithCache | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'quick' | 'deep_scan'>('deep_scan');
  const [savingToPortfolio, setSavingToPortfolio] = useState(false);
  const [savedToPortfolio, setSavedToPortfolio] = useState(false);
  
  // Manual override state for editable fields
  const [editedPrice, setEditedPrice] = useState<number | null>(null);
  const [editedRent, setEditedRent] = useState<number | null>(null);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingRent, setIsEditingRent] = useState(false);

  const handleAnalyze = async (forceRefresh = false) => {
    if (mode === 'deep_scan' && !url) {
      toast.error(t('analyzer.urlRequired') || 'Please enter a property URL for Deep Scan');
      return;
    }
    if (mode === 'quick' && (!address || !purchasePrice || !monthlyRent)) {
      toast.error(t('analyzer.fillAllFields') || 'Please fill in all fields');
      return;
    }
    
    setAnalyzing(true);
    setError(null);
    setResults(null);
    setSavedToPortfolio(false);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-property', {
        body: { 
          url: mode === 'deep_scan' ? url : undefined,
          address: mode === 'quick' ? address : undefined,
          purchasePrice: purchasePrice || undefined,
          monthlyRent: monthlyRent || undefined,
          language,
          mode,
          userId: profile?.id,
          teamId: profile?.team_id,
          forceRefresh,
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data as AnalysisResultWithCache);
      // Reset manual overrides when new results come in
      setEditedPrice(null);
      setEditedRent(null);
      setIsEditingPrice(false);
      setIsEditingRent(false);
      
      if (data.cached) {
        toast.success(t('analyzer.cachedResult') || `Cached result (${data.cache_age_minutes} min ago)`);
      } else {
        toast.success(t('analyzer.analysisComplete') || 'Deep Scan complete!');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveToPortfolio = async () => {
    if (!profile?.team_id || !results) {
      toast.error('Unable to save. Please try again.');
      return;
    }

    setSavingToPortfolio(true);
    try {
      const { error } = await supabase.from('properties').insert({
        team_id: profile.team_id,
        address: url || address || 'Unknown Address',
        purchase_price: results.financials?.purchase_price,
        monthly_rent: results.financials?.estimated_monthly_rent,
        current_value: results.financials?.purchase_price,
        monthly_expenses: results.financials?.operating_expenses,
        property_type: results.metadata?.property_type,
        status: 'analyzing',
        financial_data: results as any,
        notes: `AI Analysis - Verdict: ${results.ai_analysis?.verdict}`,
      });

      if (error) throw error;

      setSavedToPortfolio(true);
      toast.success(t('analyzer.savedToPortfolio') || 'Property added to portfolio!');
    } catch (err) {
      toast.error('Failed to save property');
    } finally {
      setSavingToPortfolio(false);
    }
  };

  const verdictStyles = {
    BUY: 'bg-primary/20 text-primary border-primary',
    NEGOTIATE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
    AVOID: 'bg-destructive/20 text-destructive border-destructive',
  };

  const verdictIcons = {
    BUY: <CheckCircle className="w-8 h-8" />,
    NEGOTIATE: <AlertTriangle className="w-8 h-8" />,
    AVOID: <XCircle className="w-8 h-8" />,
  };

  // Get effective values (manual override or original)
  const effectivePrice = editedPrice ?? results?.financials?.purchase_price ?? 0;
  const effectiveRent = editedRent ?? results?.financials?.estimated_monthly_rent ?? 0;
  
  // Recalculate metrics when manual overrides are applied
  const recalculatedMetrics = useMemo(() => {
    if (!results?.financials || (editedPrice === null && editedRent === null)) {
      return null;
    }
    
    const price = effectivePrice;
    const rent = effectiveRent;
    const opex = results.financials.operating_expenses || 0;
    
    // Recalculate core metrics
    const annualRent = rent * 12;
    const annualOpex = opex * 12;
    const noi = annualRent - annualOpex;
    const capRate = price > 0 ? (noi / price) * 100 : 0;
    const onePercentRule = price > 0 ? (rent / price) * 100 : 0;
    
    // Cash on Cash (assuming 20% down, 7% interest, 30yr)
    const downPayment = price * 0.20;
    const closingCosts = price * 0.03;
    const totalCashInvested = downPayment + closingCosts;
    const loanAmount = price * 0.80;
    const monthlyRate = 0.07 / 12;
    const totalPayments = 360;
    const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
      (Math.pow(1 + monthlyRate, totalPayments) - 1);
    const annualDebtService = monthlyMortgage * 12;
    const annualCashFlow = noi - annualDebtService;
    const cashOnCash = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
    
    return {
      cap_rate: Number(capRate.toFixed(2)),
      cash_on_cash_return: Number(cashOnCash.toFixed(2)),
      net_operating_income_annual: Math.round(noi),
      one_percent_rule: Number(onePercentRule.toFixed(2)),
      suggested_offer_price: Math.round(price * 0.95),
    };
  }, [results?.financials, editedPrice, editedRent, effectivePrice, effectiveRent]);

  // Use recalculated or original values
  const displayMetrics = recalculatedMetrics || results?.financials;

  const currency = results?.metadata?.currency_code || 'USD';
  const validationWarnings = results?.financials?.validation_warnings || [];
  const criticalWarnings = validationWarnings.filter(w => w.severity === 'critical');
  const otherWarnings = validationWarnings.filter(w => w.severity !== 'critical');
  const hasNegativeMetrics = (displayMetrics?.cap_rate || 0) < 0 || (displayMetrics?.cash_on_cash_return || 0) < 0;
  const expenseWarning = results?.financials?.expense_warning;
  const priceConfidence = results?.financials?.price_confidence_score ?? 100;
  const priceSource = editedPrice !== null ? 'user_input' : (results?.financials?.price_source || 'ai_estimated');
  const ownershipType = results?.metadata?.ownership_type || 'fee_simple';
  const isLeasehold = ownershipType !== 'fee_simple';

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className={isRTL ? "text-right" : ""}>
        <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse justify-end")}>
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('nav.analyzer')}</h1>
            <p className="text-muted-foreground">
              {t('analyzer.subtitle') || 'Powered by Gemini 3 Pro with Deep Semantic Inference'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="glass-card p-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'quick' | 'deep_scan')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="deep_scan" className="gap-2">
                <Zap className="w-4 h-4" />
                {t('analyzer.deepScan') || 'Deep Scan'}
              </TabsTrigger>
              <TabsTrigger value="quick" className="gap-2">
                <Calculator className="w-4 h-4" />
                {t('analyzer.quickAnalysis') || 'Quick Analysis'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deep_scan" className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('analyzer.deepScanInfo') || 'AI-Powered URL Analysis'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('analyzer.deepScanDesc') || 'Paste any property listing URL. The AI will extract data, detect jurisdiction, and perform full financial analysis.'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  {t('analyzer.propertyUrl') || 'Property Listing URL'}
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="input-executive pl-10"
                    placeholder="https://zillow.com/... or https://dubizzle.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {t('analyzer.priceOverride') || 'Price Override (optional)'}
                  </label>
                  <Input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="input-executive"
                    placeholder="350000"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {t('analyzer.rentOverride') || 'Rent Override (optional)'}
                  </label>
                  <Input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="input-executive"
                    placeholder="2500"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quick" className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  {t('analyzer.address') || 'Property Address'}
                </label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-executive"
                  placeholder="123 Investment Ave, Miami FL 33101"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {t('analyzer.purchasePrice') || 'Purchase Price ($)'}
                  </label>
                  <Input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="input-executive"
                    placeholder="350000"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    {t('analyzer.monthlyRent') || 'Monthly Rent ($)'}
                  </label>
                  <Input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="input-executive"
                    placeholder="2500"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={() => handleAnalyze(false)}
            disabled={analyzing}
            className="w-full btn-premium text-primary-foreground gap-2 h-12 mt-6"
          >
            {analyzing ? (
              <>
                <div className="relative">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <div className="absolute inset-0 animate-ping">
                    <Sparkles className="w-5 h-5 opacity-50" />
                  </div>
                </div>
                {t('analyzer.deepScanning') || 'Deep Scanning...'}
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                {mode === 'deep_scan' 
                  ? (t('analyzer.startDeepScan') || 'Start Deep Scan')
                  : (t('analyzer.analyze') || 'Analyze Property')}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Shimmer Loading State */}
          {analyzing && (
            <div className="mt-6 space-y-4">
              <div className="h-4 bg-secondary/50 rounded animate-pulse" />
              <div className="h-4 bg-secondary/50 rounded animate-pulse w-3/4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-secondary/50 rounded animate-pulse" />
                <div className="h-20 bg-secondary/50 rounded animate-pulse" />
              </div>
              <div className="h-32 bg-secondary/50 rounded animate-pulse" />
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="glass-card p-6">
          {results ? (
            <div className="space-y-6 animate-fade-in">
              {/* Cache Status Badge */}
              {results.cached && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-400">
                      {t('analyzer.cachedResult') || 'Cached Result'} 
                      {results.cache_age_minutes && ` (${results.cache_age_minutes} min)`}
                    </span>
                    <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                      {t('analyzer.deterministic') || 'Deterministic'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAnalyze(true)}
                    disabled={analyzing}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1"
                  >
                    <RefreshCw className={cn("w-4 h-4", analyzing && "animate-spin")} />
                    {t('analyzer.forceRefresh') || 'Refresh'}
                  </Button>
                </div>
              )}

              {/* Critical Validation Warnings */}
              {criticalWarnings.length > 0 && (
                <div className="space-y-2">
                  {criticalWarnings.map((warning, index) => (
                    <Alert key={index} variant="destructive" className="bg-destructive/10 border-destructive/50">
                      <ShieldAlert className="h-4 w-4" />
                      <AlertTitle className="flex items-center gap-2">
                        {warning.message}
                        {warning.affected_metric && (
                          <Badge variant="outline" className="text-xs border-destructive/50">
                            {warning.affected_metric}
                          </Badge>
                        )}
                      </AlertTitle>
                      <AlertDescription className="text-destructive/80 text-sm mt-1">
                        {warning.details}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Leasehold Warning Banner */}
              {isLeasehold && (
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
                  <Home className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-400">
                      {ownershipType.toUpperCase()} Property Detected
                    </p>
                    <p className="text-sm text-orange-400/80 mt-1">
                      This is NOT Fee Simple ownership. Valuation metrics differ significantly. Ground rent and lease terms should be factored into your decision.
                    </p>
                  </div>
                </div>
              )}

              {/* Price Confidence Score */}
              {priceConfidence < 75 && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-yellow-400">
                      Price Confidence: {priceConfidence}%
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400">
                    {priceSource === 'user_input' ? 'User Input' : priceSource === 'listing_price' ? 'Listing Price' : 'AI Estimated'}
                  </Badge>
                </div>
              )}

              {/* Jurisdiction & Verdict Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {jurisdictionInfo[results.metadata?.jurisdiction]?.flag || '🌍'}
                  </span>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('analyzer.jurisdiction') || 'Jurisdiction'}
                    </p>
                    <p className="font-semibold text-foreground">
                      {jurisdictionInfo[results.metadata?.jurisdiction]?.name || results.metadata?.jurisdiction}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('analyzer.currency') || 'Currency'}</p>
                  <p className="font-semibold text-foreground">{currency}</p>
                </div>
              </div>

              {/* Verdict Badge - More prominent for negative metrics */}
              <div className={cn(
                "p-6 rounded-xl border text-center relative overflow-hidden",
                hasNegativeMetrics ? "bg-destructive/30 border-destructive animate-pulse" : verdictStyles[results.ai_analysis?.verdict || 'BUY']
              )}>
                {hasNegativeMetrics && (
                  <div className="absolute inset-0 bg-gradient-to-r from-destructive/20 via-transparent to-destructive/20" />
                )}
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {hasNegativeMetrics ? (
                      <XCircle className="w-10 h-10 text-destructive animate-pulse" />
                    ) : (
                      verdictIcons[results.ai_analysis?.verdict || 'BUY']
                    )}
                    <span className={cn("text-3xl font-bold", hasNegativeMetrics && "text-destructive")}>
                      {hasNegativeMetrics ? 'AVOID' : results.ai_analysis?.verdict}
                    </span>
                  </div>
                  {hasNegativeMetrics && expenseWarning && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-destructive/80 mt-2 cursor-help underline decoration-dashed">
                            ⚠️ Negative ROI - Hover for details
                          </p>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-sm bg-popover border-border">
                          <p className="text-sm">{expenseWarning}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {!hasNegativeMetrics && (
                    <div className="flex items-center justify-center gap-2">
                      <BadgeCheck className="w-4 h-4" />
                      <span className="text-sm">
                        {t('analyzer.confidence') || 'Confidence'}: {results.ai_analysis?.confidence || 0}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Other Warnings (non-critical) */}
              {otherWarnings.length > 0 && (
                <div className="space-y-2">
                  {otherWarnings.map((warning, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "p-3 rounded-lg border flex items-start gap-2",
                        getSeverityColor(warning.severity)
                      )}
                    >
                      {getSeverityIcon(warning.severity)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{warning.message}</p>
                        {warning.details && (
                          <p className="text-xs opacity-80 mt-0.5">{warning.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Financial Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { 
                    label: t('analyzer.capRate') || 'Cap Rate', 
                    value: `${displayMetrics?.cap_rate?.toFixed(2) || 0}%`, 
                    rawValue: displayMetrics?.cap_rate || 0,
                    icon: TrendingUp,
                    highlight: (displayMetrics?.cap_rate || 0) >= 8,
                    isNegative: (displayMetrics?.cap_rate || 0) < 0,
                    tooltip: (displayMetrics?.cap_rate || 0) < 0 ? expenseWarning : undefined
                  },
                  { 
                    label: t('analyzer.cashOnCash') || 'Cash on Cash', 
                    value: `${displayMetrics?.cash_on_cash_return?.toFixed(2) || 0}%`, 
                    rawValue: displayMetrics?.cash_on_cash_return || 0,
                    icon: DollarSign,
                    highlight: (displayMetrics?.cash_on_cash_return || 0) >= 10,
                    isNegative: (displayMetrics?.cash_on_cash_return || 0) < 0,
                    tooltip: (displayMetrics?.cash_on_cash_return || 0) < 0 ? expenseWarning : undefined
                  },
                  { 
                    label: t('analyzer.annualNOI') || 'Annual NOI', 
                    value: formatCurrency(displayMetrics?.net_operating_income_annual || 0, currency), 
                    rawValue: displayMetrics?.net_operating_income_annual || 0,
                    icon: Calculator,
                    highlight: false,
                    isNegative: (displayMetrics?.net_operating_income_annual || 0) < 0,
                    tooltip: (displayMetrics?.net_operating_income_annual || 0) < 0 ? 'Operating expenses exceed rental income' : undefined
                  },
                  { 
                    label: t('analyzer.onePercentRule') || '1% Rule', 
                    value: `${displayMetrics?.one_percent_rule?.toFixed(2) || 0}%`, 
                    rawValue: displayMetrics?.one_percent_rule || 0,
                    icon: Target,
                    highlight: (displayMetrics?.one_percent_rule || 0) >= 1,
                    isNegative: false,
                    tooltip: undefined
                  },
                ].map((metric, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "p-4 rounded-lg cursor-help transition-all",
                            metric.isNegative 
                              ? "bg-destructive/20 border-2 border-destructive animate-pulse" 
                              : metric.highlight 
                                ? "bg-primary/10 border border-primary/30" 
                                : "bg-secondary/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <metric.icon className={cn(
                              "w-4 h-4", 
                              metric.isNegative ? "text-destructive" : metric.highlight ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                              "text-sm",
                              metric.isNegative ? "text-destructive" : "text-muted-foreground"
                            )}>
                              {metric.label}
                              {metric.isNegative && " ⚠️"}
                            </span>
                          </div>
                          <p className={cn(
                            "text-xl font-bold", 
                            metric.isNegative ? "text-destructive" : metric.highlight ? "text-primary" : "text-foreground"
                          )}>
                            {metric.value}
                          </p>
                        </div>
                      </TooltipTrigger>
                      {metric.tooltip && (
                        <TooltipContent side="bottom" className="max-w-xs bg-popover border-border">
                          <p className="text-sm">{metric.tooltip}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
              
              {/* Recalculation Notice */}
              {recalculatedMetrics && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary">
                    Metrics recalculated with your manual overrides
                  </span>
                </div>
              )}

              {/* OpEx Breakdown (Expandable) */}
              <OpExBreakdown
                opexBreakdown={results.financials?.opex_breakdown}
                totalOpex={results.financials?.operating_expenses || 0}
                monthlyRent={effectiveRent}
                purchasePrice={effectivePrice}
                currency={currency}
              />

              {/* Editable Price & Rent Info */}
              <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Click values to edit • Metrics update instantly
                  </span>
                  {(editedPrice !== null || editedRent !== null) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditedPrice(null); setEditedRent(null); setIsEditingPrice(false); setIsEditingRent(false); }}
                      className="text-xs text-muted-foreground hover:text-foreground h-6 px-2"
                    >
                      Reset to AI values
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Editable Purchase Price */}
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {t('analyzer.purchasePrice') || 'Purchase Price'}
                      {editedPrice !== null && <Badge variant="outline" className="text-xs ml-1 border-primary/50 text-primary">Edited</Badge>}
                    </p>
                    {isEditingPrice ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-foreground">$</span>
                        <Input
                          type="number"
                          autoFocus
                          value={editedPrice ?? results.financials?.purchase_price ?? ''}
                          onChange={(e) => setEditedPrice(e.target.value ? Number(e.target.value) : null)}
                          onBlur={() => setIsEditingPrice(false)}
                          onKeyDown={(e) => e.key === 'Enter' && setIsEditingPrice(false)}
                          className="h-8 text-lg font-bold w-32 px-2"
                        />
                      </div>
                    ) : (
                      <p 
                        className="text-lg font-bold text-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                        onClick={() => setIsEditingPrice(true)}
                      >
                        {formatCurrency(effectivePrice, currency)}
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">✏️</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Editable Monthly Rent */}
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {t('analyzer.monthlyRent') || 'Monthly Rent'}
                      {editedRent !== null && <Badge variant="outline" className="text-xs ml-1 border-primary/50 text-primary">Edited</Badge>}
                      {results.financials?.is_rent_estimated && editedRent === null && (
                        <Badge variant="outline" className="text-xs ml-1 border-yellow-500/50 text-yellow-400">Estimated</Badge>
                      )}
                    </p>
                    {isEditingRent ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-primary">$</span>
                        <Input
                          type="number"
                          autoFocus
                          value={editedRent ?? results.financials?.estimated_monthly_rent ?? ''}
                          onChange={(e) => setEditedRent(e.target.value ? Number(e.target.value) : null)}
                          onBlur={() => setIsEditingRent(false)}
                          onKeyDown={(e) => e.key === 'Enter' && setIsEditingRent(false)}
                          className="h-8 text-lg font-bold w-32 px-2"
                        />
                      </div>
                    ) : (
                      <p 
                        className="text-lg font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors flex items-center gap-1"
                        onClick={() => setIsEditingRent(true)}
                      >
                        {formatCurrency(effectiveRent, currency)}
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">✏️</span>
                      </p>
                    )}
                  </div>
                </div>
                {displayMetrics?.suggested_offer_price && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">{t('analyzer.suggestedOffer') || 'AI Suggested Offer'}</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(displayMetrics.suggested_offer_price, currency)}
                    </p>
                  </div>
                )}
              </div>

              {/* Save to Portfolio Button */}
              <div className="pt-2">
                <Button
                  onClick={handleSaveToPortfolio}
                  disabled={savingToPortfolio || savedToPortfolio}
                  className={cn(
                    "w-full h-12 gap-2 text-base font-semibold transition-all",
                    savedToPortfolio 
                      ? "bg-primary/20 text-primary border border-primary/30 cursor-default" 
                      : "btn-premium text-primary-foreground"
                  )}
                >
                  {savingToPortfolio ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      {t('analyzer.saving') || 'Saving...'}
                    </>
                  ) : savedToPortfolio ? (
                    <>
                      <Check className="w-5 h-5" />
                      {t('analyzer.alreadySaved') || 'Added to Portfolio'}
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      {t('analyzer.saveToPortfolio') || 'Add to Portfolio'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {t('analyzer.saveToPortfolioDesc') || 'Save to track this property in your portfolio'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center mb-4">
                <Brain className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('analyzer.readyToScan') || 'Ready for Deep Scan'}
              </h3>
              <p className="text-muted-foreground max-w-sm">
                {t('analyzer.readyToScanDesc') || 'Enter a property URL or details to unlock AI-powered investment analysis with jurisdiction-aware insights.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Analysis Sections */}
      {results && (
        <div className="space-y-8 animate-fade-in">
          {/* Market Comparables Section */}
          <MarketComparables
            comparables={results.market_comparables}
            suggestedOfferPrice={results.financials?.suggested_offer_price}
            purchasePrice={results.financials?.purchase_price || 0}
            currency={currency}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Reasoning */}
            <div className="glass-card p-6">
              <h3 className={cn("font-semibold text-foreground mb-4 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Sparkles className="w-5 h-5 text-primary" />
                {t('analyzer.aiReasoning') || 'AI Analysis'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {results.ai_analysis?.reasoning}
              </p>
            </div>

            {/* Tax Strategy */}
            <div className="glass-card p-6">
              <h3 className={cn("font-semibold text-foreground mb-4 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Globe className="w-5 h-5 text-blue-400" />
                {t('analyzer.taxStrategy') || 'Tax Strategy'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {results.ai_analysis?.tax_strategy}
              </p>
            </div>

            {/* Strengths & Red Flags */}
            <div className="glass-card p-6">
              <h3 className={cn("font-semibold text-foreground mb-4 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Shield className="w-5 h-5 text-primary" />
                {t('analyzer.strengthsAndRisks') || 'Strengths & Risks'}
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-primary font-medium mb-2">
                    ✅ {t('analyzer.strengths') || 'Strengths'}
                  </p>
                  <ul className="space-y-1">
                    {results.ai_analysis?.strengths?.map((s, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-destructive font-medium mb-2">
                    ⚠️ {t('analyzer.redFlags') || 'Red Flags'}
                  </p>
                  <ul className="space-y-1">
                    {results.ai_analysis?.red_flags?.map((r, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Forced Appreciation */}
            <div className="glass-card p-6">
              <h3 className={cn("font-semibold text-foreground mb-4 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                {t('analyzer.forcedAppreciation') || 'Value-Add Opportunities'}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {results.ai_analysis?.forced_appreciation}
              </p>
              
              {results.rehab_suggestions && results.rehab_suggestions.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-medium text-foreground">
                    {t('analyzer.rehabSuggestions') || 'Rehab Suggestions'}
                  </p>
                  {results.rehab_suggestions.map((rehab, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Hammer className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{rehab.item}</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          rehab.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                          rehab.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-secondary text-muted-foreground'
                        )}>
                          {rehab.priority}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(rehab.estimated_cost, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Negotiation Script */}
            <div className="glass-card p-6 lg:col-span-2">
              <h3 className={cn("font-semibold text-foreground mb-4 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <FileText className="w-5 h-5 text-blue-400" />
                {t('analyzer.negotiationScript') || 'Negotiation Script'}
              </h3>
              <div className="p-4 bg-secondary/50 rounded-lg border-l-4 border-primary">
                <p className="text-muted-foreground leading-relaxed italic">
                  "{results.ai_analysis?.negotiation_script}"
                </p>
              </div>
            </div>
          </div>

          {/* 5-Year Projection Card */}
          <FiveYearProjection
            currentValue={results.financials?.purchase_price || 0}
            purchasePrice={results.financials?.purchase_price || 0}
            currency={currency}
          />
        </div>
      )}
    </div>
  );
};

export default Analyzer;
