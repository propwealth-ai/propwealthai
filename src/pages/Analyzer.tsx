import React, { useState } from 'react';
import { 
  Brain, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Calculator,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const Analyzer: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [address, setAddress] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!address || !purchasePrice || !monthlyRent) return;
    
    setAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const price = parseFloat(purchasePrice);
    const rent = parseFloat(monthlyRent);
    const annualRent = rent * 12;
    const expenses = annualRent * 0.4; // Estimate 40% expenses
    const noi = annualRent - expenses;
    const capRate = (noi / price) * 100;
    const downPayment = price * 0.25;
    const annualCashFlow = noi - (price * 0.75 * 0.07); // Assume 7% interest
    const cashOnCash = (annualCashFlow / downPayment) * 100;

    setResults({
      capRate: capRate.toFixed(2),
      noi: noi.toFixed(0),
      cashOnCash: cashOnCash.toFixed(2),
      monthlyExpenses: (expenses / 12).toFixed(0),
      annualCashFlow: annualCashFlow.toFixed(0),
      recommendation: capRate >= 8 ? 'strong_buy' : capRate >= 6 ? 'buy' : 'hold',
    });
    
    setAnalyzing(false);
  };

  const recommendationStyles = {
    strong_buy: 'bg-primary/20 text-primary border-primary',
    buy: 'bg-blue-500/20 text-blue-400 border-blue-500',
    hold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
  };

  const recommendationLabels = {
    strong_buy: '🚀 Strong Buy',
    buy: '✅ Buy',
    hold: '⏸️ Hold',
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
          Let AI analyze your next investment opportunity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="glass-card p-6">
          <h2 className={cn("text-xl font-semibold text-foreground mb-6 flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Building2 className="w-5 h-5 text-primary" />
            Property Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Property Address
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
                  Purchase Price ($)
                </label>
                <Input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="input-executive"
                  placeholder="350,000"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Monthly Rent ($)
                </label>
                <Input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="input-executive"
                  placeholder="2,500"
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
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Analyze Property
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="glass-card p-6">
          <h2 className={cn("text-xl font-semibold text-foreground mb-6 flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Calculator className="w-5 h-5 text-primary" />
            Analysis Results
          </h2>

          {results ? (
            <div className="space-y-6 animate-fade-in">
              {/* Recommendation Badge */}
              <div className={cn(
                "p-4 rounded-xl border text-center",
                recommendationStyles[results.recommendation as keyof typeof recommendationStyles]
              )}>
                <span className="text-2xl font-bold">
                  {recommendationLabels[results.recommendation as keyof typeof recommendationLabels]}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Cap Rate', value: `${results.capRate}%`, icon: TrendingUp },
                  { label: 'Cash on Cash', value: `${results.cashOnCash}%`, icon: DollarSign },
                  { label: 'Annual NOI', value: `$${parseInt(results.noi).toLocaleString()}`, icon: Calculator },
                  { label: 'Annual Cash Flow', value: `$${parseInt(results.annualCashFlow).toLocaleString()}`, icon: DollarSign },
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
                <h4 className="text-sm text-muted-foreground mb-3">Monthly Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Rent</span>
                    <span className="text-foreground font-medium">${parseInt(monthlyRent).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Expenses (40%)</span>
                    <span className="text-destructive font-medium">-${parseInt(results.monthlyExpenses).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="text-foreground font-medium">Net Operating Income</span>
                    <span className="text-primary font-bold">${(parseInt(results.noi) / 12).toLocaleString()}</span>
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
                Enter Property Details
              </h3>
              <p className="text-muted-foreground max-w-sm">
                Fill in the property information on the left to get an AI-powered investment analysis.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="glass-card p-6">
        <h3 className={cn("font-semibold text-foreground mb-4", isRTL && "text-right")}>
          💡 Quick Investment Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Cap Rate > 8%', desc: 'Generally indicates a strong cash-flowing property' },
            { title: 'Cash on Cash > 12%', desc: 'Your money is working hard for you' },
            { title: 'The 1% Rule', desc: 'Monthly rent should be 1% of purchase price' },
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
