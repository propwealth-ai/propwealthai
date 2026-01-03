import React from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import TrustBar from '@/components/landing/TrustBar';
import FeatureGrid from '@/components/landing/FeatureGrid';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

const Index: React.FC = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('landing.metaTitle')}</title>
        <meta name="description" content={t('landing.metaDescription')} />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNavbar />
        <main>
          <HeroSection />
          <TrustBar />
          <section id="features">
            <FeatureGrid />
          </section>
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
