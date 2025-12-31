import React, { useState } from 'react';
import { 
  Brain, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Calculator,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalysisResults {
  metrics: {
    capRate: string;
    noi: string;
    cashOnCash: string;
    monthlyExpenses: string;
    annualCashFlow: string;
    onePercentRule: string;
    recommendation: 'strong_buy' | 'buy' | 'hold' | 'pass';
  };
  aiAnalysis: string;
}

const Analyzer: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const [address, setAddress] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!address || !purchasePrice || !monthlyRent) return;
    
    setAnalyzing(true);
    setError(null);
    setResults(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-property', {
        body: { 
          address, 
          purchasePrice, 
          monthlyRent,
          language 
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data);
      toast.success(t('analyzer.analysisComplete') || 'Analysis complete!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      toast.error(message);
    } finally {
      setAnalyzing(false);
    }
  };

  const recommendationStyles = {
    strong_buy: 'bg-primary/20 text-primary border-primary',
    buy: 'bg-blue-500/20 text-blue-400 border-blue-500',
    hold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
    pass: 'bg-destructive/20 text-destructive border-destructive',
  };

  const recommendationLabels = {
    strong_buy: '🚀 Strong Buy',
    buy: '✅ Buy',
    hold: '⏸️ Hold',
    pass: '❌ Pass',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className={isRTL ? "text-right" : ""}>
        <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse justify-end")}>
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">{t('nav.analyzer')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('analyzer.subtitle') || 'AI-powered investment analysis using advanced language models'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="glass-card p-6">
          <h2 className={cn("text-xl font-semibold text-foreground mb-6 flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Building2 className="w-5 h-5 text-primary" />
            {t('analyzer.propertyDetails') || 'Property Details'}
          </h2>
          
          <div className="space-y-4">
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

            <Button
              onClick={handleAnalyze}
              disabled={!address || !purchasePrice || !monthlyRent || analyzing}
              className="w-full btn-premium text-primary-foreground gap-2 h-12"
            >
              {analyzing ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  {t('analyzer.analyzing') || 'Analyzing with AI...'}
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  {t('analyzer.analyze') || 'Analyze Property'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="glass-card p-6">
          <h2 className={cn("text-xl font-semibold text-foreground mb-6 flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Calculator className="w-5 h-5 text-primary" />
            {t('analyzer.results') || 'Analysis Results'}
          </h2>

          {results ? (
            <div className="space-y-6 animate-fade-in">
              {/* Recommendation Badge */}
              <div className={cn(
                "p-4 rounded-xl border text-center",
                recommendationStyles[results.metrics.recommendation]
              )}>
                <span className="text-2xl font-bold">
                  {recommendationLabels[results.metrics.recommendation]}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t('analyzer.capRate') || 'Cap Rate', value: `${results.metrics.capRate}%`, icon: TrendingUp },
                  { label: t('analyzer.cashOnCash') || 'Cash on Cash', value: `${results.metrics.cashOnCash}%`, icon: DollarSign },
                  { label: t('analyzer.annualNOI') || 'Annual NOI', value: `$${parseInt(results.metrics.noi).toLocaleString()}`, icon: Calculator },
                  { label: t('analyzer.annualCashFlow') || 'Annual Cash Flow', value: `$${parseInt(results.metrics.annualCashFlow).toLocaleString()}`, icon: DollarSign },
                ].map((metric, index) => (
                  <div
                    key={index}
                    className="p-4 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{metric.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Monthly Breakdown */}
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h4 className="text-sm text-muted-foreground mb-3">
                  {t('analyzer.monthlyBreakdown') || 'Monthly Breakdown'}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('analyzer.grossRent') || 'Gross Rent'}</span>
                    <span className="text-foreground font-medium">${parseInt(monthlyRent).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('analyzer.expenses') || 'Est. Expenses (40%)'}</span>
                    <span className="text-destructive font-medium">-${parseInt(results.metrics.monthlyExpenses).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="text-foreground font-medium">{t('analyzer.noi') || 'Net Operating Income'}</span>
                    <span className="text-primary font-bold">${(parseInt(results.metrics.noi) / 12).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('analyzer.enterDetails') || 'Enter Property Details'}
              </h3>
              <p className="text-muted-foreground max-w-sm">
                {t('analyzer.enterDetailsDesc') || 'Fill in the property information on the left to get an AI-powered investment analysis.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis Section */}
      {results?.aiAnalysis && (
        <div className="glass-card p-6 animate-fade-in">
          <h3 className={cn("font-semibold text-foreground mb-4 flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Sparkles className="w-5 h-5 text-primary" />
            {t('analyzer.aiInsights') || 'AI Investment Insights'}
          </h3>
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {results.aiAnalysis}
            </div>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="glass-card p-6">
        <h3 className={cn("font-semibold text-foreground mb-4", isRTL && "text-right")}>
          💡 {t('analyzer.quickTips') || 'Quick Investment Tips'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              title: t('analyzer.tipCapRate') || 'Cap Rate > 8%', 
              desc: t('analyzer.tipCapRateDesc') || 'Generally indicates a strong cash-flowing property' 
            },
            { 
              title: t('analyzer.tipCashOnCash') || 'Cash on Cash > 12%', 
              desc: t('analyzer.tipCashOnCashDesc') || 'Your money is working hard for you' 
            },
            { 
              title: t('analyzer.tipOnePercent') || 'The 1% Rule', 
              desc: t('analyzer.tipOnePercentDesc') || 'Monthly rent should be 1% of purchase price' 
            },
          ].map((tip, index) => (
            <div key={index} className="p-4 bg-secondary/50 rounded-lg">
              <p className="font-medium text-primary mb-1">{tip.title}</p>
              <p className="text-sm text-muted-foreground">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analyzer;
