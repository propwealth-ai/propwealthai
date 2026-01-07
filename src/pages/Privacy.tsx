import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const LOGO_URL = "https://ik.imagekit.io/PropWealthAI/PropWealth%20AI%20/logo%20propwealth%20ai%20oficial%20(1)%20(1)%20-%20Copia.png?updatedAt=1767806427490";

const Privacy: React.FC = () => {
  const { t } = useLanguage();
  const lastUpdated = 'January 6, 2025';

  return (
    <>
      <Helmet>
        <title>Privacy Policy | PropWealth AI</title>
        <meta name="description" content="PropWealth AI Privacy Policy - Learn how we collect, use, and protect your personal information." />
        <link rel="canonical" href="https://www.propwealthai.com/privacy" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <Link to="/" className="flex items-center gap-2 sm:gap-3">
                <img src={LOGO_URL} alt="PropWealth AI" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain" />
                <span className="text-lg sm:text-xl font-bold text-foreground hidden xs:inline">PropWealth AI</span>
              </Link>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="gap-1 sm:gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('common.back')}</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="py-8 sm:py-12 md:py-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="glass-card p-4 sm:p-6 md:p-8 lg:p-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">Privacy Policy</h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Last updated: {lastUpdated}</p>

              <div className="prose prose-invert max-w-none space-y-8">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
                  <p className="text-muted-foreground">
                    PropWealth AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
                    how we collect, use, disclose, and safeguard your information when you use our website (www.propwealthai.com) 
                    and our AI-powered real estate investment platform (collectively, the "Service").
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
                  <h3 className="text-lg font-medium text-foreground mb-2">2.1 Personal Information</h3>
                  <p className="text-muted-foreground mb-3">We may collect the following personal information:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Name and email address</li>
                    <li>Account credentials</li>
                    <li>Payment information (processed securely through third-party providers)</li>
                    <li>Property analysis preferences and history</li>
                    <li>Communication preferences</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium text-foreground mb-2 mt-4">2.2 Automatically Collected Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Device information (browser type, operating system)</li>
                    <li>IP address and location data</li>
                    <li>Usage data and analytics</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
                  <p className="text-muted-foreground mb-3">We use the collected information to:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Provide and maintain our Service</li>
                    <li>Process transactions and send related information</li>
                    <li>Send promotional communications (with your consent)</li>
                    <li>Improve our AI algorithms and user experience</li>
                    <li>Respond to customer service requests</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">4. Information Sharing</h2>
                  <p className="text-muted-foreground">
                    We do not sell, trade, or rent your personal information to third parties. We may share your 
                    information with trusted service providers who assist us in operating our Service, subject to 
                    confidentiality agreements. We may also disclose information when required by law or to protect 
                    our rights.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Security</h2>
                  <p className="text-muted-foreground">
                    We implement industry-standard security measures to protect your personal information, including 
                    encryption, secure servers, and access controls. However, no method of transmission over the 
                    Internet is 100% secure, and we cannot guarantee absolute security.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">6. Your Rights</h2>
                  <p className="text-muted-foreground mb-3">You have the right to:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Object to data processing</li>
                    <li>Data portability</li>
                    <li>Withdraw consent at any time</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">7. International Data Transfers</h2>
                  <p className="text-muted-foreground">
                    Your information may be transferred to and processed in countries other than your own. We ensure 
                    appropriate safeguards are in place to protect your information in accordance with applicable 
                    data protection laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">8. Children's Privacy</h2>
                  <p className="text-muted-foreground">
                    Our Service is not intended for individuals under the age of 18. We do not knowingly collect 
                    personal information from children. If we become aware that we have collected personal information 
                    from a child, we will take steps to delete such information.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">9. Changes to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                    the new Privacy Policy on this page and updating the "Last updated" date.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">10. Contact Us</h2>
                  <p className="text-muted-foreground">
                    If you have questions about this Privacy Policy, please contact us at:
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Email: info@propwealthai.com<br />
                    Website: www.propwealthai.com
                  </p>
                </section>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8">
          <div className="container mx-auto px-6 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PropWealth AI. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Privacy;
