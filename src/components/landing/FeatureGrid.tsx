import React from 'react';
import { Brain, LineChart, Users, Zap, Shield, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const FeatureGrid: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Brain,
      title: t('landing.featureAiTitle'),
      description: t('landing.featureAiDesc'),
      gradient: 'from-primary to-emerald-400',
    },
    {
      icon: LineChart,
      title: t('landing.featureProjectionsTitle'),
      description: t('landing.featureProjectionsDesc'),
      gradient: 'from-blue-500 to-cyan-400',
    },
    {
      icon: Users,
      title: t('landing.featurePartnerTitle'),
      description: t('landing.featurePartnerDesc'),
      gradient: 'from-purple-500 to-pink-400',
    },
    {
      icon: Zap,
      title: t('landing.featureSpeedTitle'),
      description: t('landing.featureSpeedDesc'),
      gradient: 'from-yellow-500 to-orange-400',
    },
    {
      icon: Shield,
      title: t('landing.featureSecurityTitle'),
      description: t('landing.featureSecurityDesc'),
      gradient: 'from-red-500 to-rose-400',
    },
    {
      icon: Globe,
      title: t('landing.featureGlobalTitle'),
      description: t('landing.featureGlobalDesc'),
      gradient: 'from-teal-500 to-green-400',
    },
  ];

  return (
    <section className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background"></div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm text-primary font-medium">{t('landing.featuresLabel')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('landing.featuresTitle')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('landing.featuresSubtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass-card p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
