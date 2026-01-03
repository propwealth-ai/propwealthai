import React from 'react';
import { Building2, TrendingUp, Target, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const TrustBar: React.FC = () => {
  const { t } = useLanguage();

  const metrics = [
    {
      icon: Building2,
      value: '10,000+',
      label: t('landing.propertiesAnalyzed'),
    },
    {
      icon: TrendingUp,
      value: '$2.5B+',
      label: t('landing.portfolioValue'),
    },
    {
      icon: Target,
      value: '98%',
      label: t('landing.accuracyRate'),
    },
    {
      icon: Users,
      value: '50+',
      label: t('landing.countriesServed'),
    },
  ];

  return (
    <section className="py-12 border-y border-border/30 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <metric.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground">{metric.value}</div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
