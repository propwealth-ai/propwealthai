import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const CTASection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/30 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">{t('landing.ctaLabel')}</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {t('landing.ctaTitle')}
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            {t('landing.ctaSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="btn-premium text-primary-foreground font-semibold h-14 px-8 text-lg"
              onClick={() => navigate('/auth')}
            >
              {t('landing.ctaPrimary')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            {t('landing.ctaNote')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
