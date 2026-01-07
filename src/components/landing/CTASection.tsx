import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const CTASection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[800px] h-[200px] md:h-[400px] bg-primary/30 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 md:mb-6">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
            <span className="text-xs md:text-sm text-primary font-medium">{t('landing.ctaLabel')}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
            {t('landing.ctaTitle')}
          </h2>
          
          <p className="text-sm md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto">
            {t('landing.ctaSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Button 
              size="lg" 
              className="btn-premium text-primary-foreground font-semibold h-12 md:h-14 px-6 md:px-8 text-base md:text-lg"
              onClick={() => navigate('/auth')}
            >
              {t('landing.ctaPrimary')}
              <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>

          <p className="mt-4 md:mt-6 text-xs md:text-sm text-muted-foreground">
            {t('landing.ctaNote')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
