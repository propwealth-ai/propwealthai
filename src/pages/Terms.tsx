import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const LOGO_URL = "https://ik.imagekit.io/PropWealthAI/PropWealth%20AI%20/logo%20ofial%20propwealth%202%20-%20Copia%20(1)%20-%20Copia.png?updatedAt=1767203215713";

const Terms: React.FC = () => {
  const { t } = useLanguage();
  const lastUpdated = 'January 6, 2025';

  return (
    <>
      <Helmet>
        <title>Terms of Service | PropWealth AI</title>
        <meta name="description" content="PropWealth AI Terms of Service - Read our terms and conditions for using our AI-powered real estate investment platform." />
        <link rel="canonical" href="https://www.propwealthai.com/terms" />
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
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">Terms of Service</h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Last updated: {lastUpdated}</p>

              <div className="prose prose-invert max-w-none space-y-8">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                  <p className="text-muted-foreground">
                    By accessing or using PropWealth AI's website (www.propwealthai.com) and services (collectively, 
                    the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree 
                    to these Terms, please do not use our Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
                  <p className="text-muted-foreground">
                    PropWealth AI provides an AI-powered real estate investment analysis platform that helps users 
                    analyze properties, track portfolios, and make informed investment decisions. Our Service includes 
                    property analysis tools, educational content, team collaboration features, and related functionalities.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">3. User Accounts</h2>
                  <p className="text-muted-foreground mb-3">To use certain features of our Service, you must:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Be at least 18 years of age</li>
                    <li>Provide accurate and complete registration information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Notify us immediately of any unauthorized use</li>
                    <li>Accept responsibility for all activities under your account</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">4. Subscription and Payments</h2>
                  <p className="text-muted-foreground mb-3">
                    Some features of our Service require a paid subscription. By subscribing:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>You authorize us to charge your payment method on a recurring basis</li>
                    <li>Subscription fees are non-refundable except as required by law</li>
                    <li>We may change subscription prices with 30 days notice</li>
                    <li>You may cancel your subscription at any time</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">5. Intellectual Property</h2>
                  <p className="text-muted-foreground">
                    All content, features, and functionality of the Service, including but not limited to text, 
                    graphics, logos, AI algorithms, and software, are the exclusive property of PropWealth AI 
                    and are protected by international copyright, trademark, and other intellectual property laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">6. User Content</h2>
                  <p className="text-muted-foreground">
                    You retain ownership of content you submit through our Service. By submitting content, you grant 
                    us a non-exclusive, worldwide, royalty-free license to use, reproduce, and process such content 
                    for the purpose of providing and improving our Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">7. Prohibited Activities</h2>
                  <p className="text-muted-foreground mb-3">You agree not to:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Use the Service for any unlawful purpose</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Interfere with or disrupt the Service</li>
                    <li>Scrape or harvest data without permission</li>
                    <li>Impersonate any person or entity</li>
                    <li>Transmit malware or harmful code</li>
                    <li>Violate any applicable laws or regulations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">8. Disclaimer of Warranties</h2>
                  <p className="text-muted-foreground">
                    THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE 
                    SERVICE WILL BE ERROR-FREE, SECURE, OR UNINTERRUPTED. OUR AI ANALYSIS IS FOR INFORMATIONAL 
                    PURPOSES ONLY AND SHOULD NOT BE CONSIDERED FINANCIAL OR INVESTMENT ADVICE.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">9. Limitation of Liability</h2>
                  <p className="text-muted-foreground">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROPWEALTH AI SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                    INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, 
                    WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER 
                    INTANGIBLE LOSSES.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">10. Investment Disclaimer</h2>
                  <p className="text-muted-foreground">
                    PropWealth AI provides tools and analysis for educational and informational purposes only. 
                    We are not registered investment advisors, and our Service does not constitute financial, 
                    investment, legal, or tax advice. All investment decisions should be made after consulting 
                    with qualified professionals. Past performance does not guarantee future results.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">11. Indemnification</h2>
                  <p className="text-muted-foreground">
                    You agree to indemnify and hold harmless PropWealth AI and its officers, directors, employees, 
                    and agents from any claims, damages, losses, or expenses arising from your use of the Service 
                    or violation of these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">12. Termination</h2>
                  <p className="text-muted-foreground">
                    We may terminate or suspend your account and access to the Service immediately, without prior 
                    notice or liability, for any reason, including breach of these Terms. Upon termination, your 
                    right to use the Service will immediately cease.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">13. Governing Law</h2>
                  <p className="text-muted-foreground">
                    These Terms shall be governed by and construed in accordance with applicable laws, without 
                    regard to conflict of law principles. Any disputes arising from these Terms shall be resolved 
                    through binding arbitration.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">14. Changes to Terms</h2>
                  <p className="text-muted-foreground">
                    We reserve the right to modify these Terms at any time. We will notify users of significant 
                    changes via email or through the Service. Continued use of the Service after changes constitutes 
                    acceptance of the modified Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">15. Contact Information</h2>
                  <p className="text-muted-foreground">
                    For questions about these Terms, please contact us at:
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

export default Terms;
