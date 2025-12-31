import React, { useState } from 'react';
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
  Link
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DeepScanResult, jurisdictionInfo, formatCurrency } from '@/types/deepScan';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Analyzer: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const [url, setUrl] = useState('');
  const [address, setAddress] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<DeepScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'quick' | 'deep_scan'>('deep_scan');

  const handleAnalyze = async () => {
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
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data as DeepScanResult);
      toast.success(t('analyzer.analysisComplete') || 'Deep Scan complete!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      toast.error(message);
    } finally {
      setAnalyzing(false);
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

  const currency = results?.metadata?.currency_code || 'USD';

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
            onClick={handleAnalyze}
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
                {t('analyzer.deepScanning') || 'Deep Scanning with Gemini 3 Pro...'}
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

              {/* Verdict Badge */}
              <div className={cn(
                "p-6 rounded-xl border text-center",
                verdictStyles[results.ai_analysis?.verdict || 'BUY']
              )}>
                <div className="flex items-center justify-center gap-3 mb-2">
                  {verdictIcons[results.ai_analysis?.verdict || 'BUY']}
                  <span className="text-3xl font-bold">
                    {results.ai_analysis?.verdict}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <BadgeCheck className="w-4 h-4" />
                  <span className="text-sm">
                    {t('analyzer.confidence') || 'Confidence'}: {results.ai_analysis?.confidence || 0}%
                  </span>
                </div>
              </div>

              {/* Financial Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { 
                    label: t('analyzer.capRate') || 'Cap Rate', 
                    value: `${results.financials?.cap_rate?.toFixed(2) || 0}%`, 
                    icon: TrendingUp,
                    highlight: (results.financials?.cap_rate || 0) >= 8
                  },
                  { 
                    label: t('analyzer.cashOnCash') || 'Cash on Cash', 
                    value: `${results.financials?.cash_on_cash_return?.toFixed(2) || 0}%`, 
                    icon: DollarSign,
                    highlight: (results.financials?.cash_on_cash_return || 0) >= 10
                  },
                  { 
                    label: t('analyzer.annualNOI') || 'Annual NOI', 
                    value: formatCurrency(results.financials?.net_operating_income_annual || 0, currency), 
                    icon: Calculator,
                    highlight: false
                  },
                  { 
                    label: t('analyzer.onePercentRule') || '1% Rule', 
                    value: `${results.financials?.one_percent_rule?.toFixed(2) || 0}%`, 
                    icon: Target,
                    highlight: (results.financials?.one_percent_rule || 0) >= 1
                  },
                ].map((metric, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg",
                      metric.highlight ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className={cn("w-4 h-4", metric.highlight ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm text-muted-foreground">{metric.label}</span>
                    </div>
                    <p className={cn("text-xl font-bold", metric.highlight ? "text-primary" : "text-foreground")}>
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Info */}
              <div className="p-4 bg-secondary/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('analyzer.purchasePrice') || 'Purchase Price'}</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(results.financials?.purchase_price || 0, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('analyzer.monthlyRent') || 'Monthly Rent'}</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(results.financials?.estimated_monthly_rent || 0, currency)}
                    </p>
                  </div>
                </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
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
      )}
    </div>
  );
};

export default Analyzer;
