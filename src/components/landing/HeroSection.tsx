import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden pt-16 md:pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"></div>
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(hsla(160, 84%, 39%, 0.4) 1px, transparent 1px),
                            linear-gradient(90deg, hsla(160, 84%, 39%, 0.4) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      ></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-48 md:w-72 h-48 md:h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-64 md:w-96 h-64 md:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-5 md:space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              <span className="text-xs md:text-sm text-primary font-medium">{t('landing.badge')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              {t('landing.heroTitle')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                {t('landing.heroTitleHighlight')}
              </span>
            </h1>

            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t('landing.heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="btn-premium text-primary-foreground font-semibold h-12 md:h-14 px-6 md:px-8 text-base md:text-lg"
                onClick={() => navigate('/auth')}
              >
                {t('landing.ctaPrimary')}
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg border-border/50 hover:bg-muted/50"
              >
                <Play className="mr-2 w-4 h-4 md:w-5 md:h-5" />
                {t('landing.ctaSecondary')}
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 md:gap-8 pt-4 justify-center lg:justify-start">
              <div className="flex -space-x-2 md:-space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-emerald-600 border-2 border-background flex items-center justify-center text-xs font-bold text-primary-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">500+</span> {t('landing.investorsJoined')}
              </p>
            </div>
          </div>

          {/* Right Content - Analyzer Mockup */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main Card */}
              <div className="glass-card p-6 rounded-2xl border border-primary/20 shadow-2xl shadow-primary/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-muted-foreground ml-2">AI Property Analyzer</span>
                </div>
                
                {/* Property Preview */}
                <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">100 W 57th St, NYC</span>
                    <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">Co-op</span>
                  </div>
                  <div className="text-3xl font-bold text-money mb-2">$139,000</div>
                  <div className="text-sm text-muted-foreground">650 sqft • 1 Bed • 1 Bath</div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-primary">8.2%</div>
                    <div className="text-xs text-muted-foreground">Cap Rate</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-money">12.4%</div>
                    <div className="text-xs text-muted-foreground">CoC ROI</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-foreground">$1,850</div>
                    <div className="text-xs text-muted-foreground">Rent Est.</div>
                  </div>
                </div>

                {/* AI Verdict */}
                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-primary">AI Verdict: Strong Buy</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -right-4 -top-4 glass-card px-4 py-2 rounded-full border border-primary/20 animate-bounce">
                <span className="text-sm font-semibold text-primary">Live Analysis</span>
              </div>

              {/* Floating Stats Card */}
              <div className="absolute -left-8 bottom-20 glass-card p-4 rounded-xl border border-border/50 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="text-2xl font-bold text-money">+$42K</div>
                <div className="text-xs text-muted-foreground">5-Year Equity</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
