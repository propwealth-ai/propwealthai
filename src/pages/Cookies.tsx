import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const LOGO_URL = "https://ik.imagekit.io/PropWealthAI/PropWealth%20AI%20/logo%20ofial%20propwealth%202%20-%20Copia%20(1)%20-%20Copia.png?updatedAt=1767203215713";

const Cookies: React.FC = () => {
  const { t } = useLanguage();
  const lastUpdated = 'January 6, 2025';

  return (
    <>
      <Helmet>
        <title>Cookie Policy | PropWealth AI</title>
        <meta name="description" content="PropWealth AI Cookie Policy - Learn about how we use cookies and similar technologies on our platform." />
        <link rel="canonical" href="https://www.propwealthai.com/cookies" />
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
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">Cookie Policy</h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Last updated: {lastUpdated}</p>

              <div className="prose prose-invert max-w-none space-y-8">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">1. What Are Cookies?</h2>
                  <p className="text-muted-foreground">
                    Cookies are small text files that are placed on your device when you visit a website. They are 
                    widely used to make websites work more efficiently, provide a better user experience, and 
                    provide information to website owners.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Cookies</h2>
                  <p className="text-muted-foreground mb-3">PropWealth AI uses cookies for the following purposes:</p>
                  
                  <h3 className="text-lg font-medium text-foreground mb-2">2.1 Essential Cookies</h3>
                  <p className="text-muted-foreground mb-3">
                    These cookies are necessary for the website to function properly. They enable core functionalities 
                    such as security, network management, and account access. You cannot opt out of these cookies.
                  </p>
                  
                  <h3 className="text-lg font-medium text-foreground mb-2">2.2 Performance Cookies</h3>
                  <p className="text-muted-foreground mb-3">
                    These cookies help us understand how visitors interact with our website by collecting and 
                    reporting information anonymously. They help us improve our website's performance.
                  </p>
                  
                  <h3 className="text-lg font-medium text-foreground mb-2">2.3 Functionality Cookies</h3>
                  <p className="text-muted-foreground mb-3">
                    These cookies enable the website to provide enhanced functionality and personalization, such as 
                    remembering your language preference and login information.
                  </p>
                  
                  <h3 className="text-lg font-medium text-foreground mb-2">2.4 Analytics Cookies</h3>
                  <p className="text-muted-foreground">
                    We use analytics cookies to understand how users engage with our website. This helps us improve 
                    our services and user experience.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">3. Cookies We Use</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-foreground">Cookie Name</th>
                          <th className="text-left py-3 px-4 text-foreground">Purpose</th>
                          <th className="text-left py-3 px-4 text-foreground">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">session_id</td>
                          <td className="py-3 px-4">Maintains user session</td>
                          <td className="py-3 px-4">Session</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">auth_token</td>
                          <td className="py-3 px-4">Authentication</td>
                          <td className="py-3 px-4">7 days</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">language_pref</td>
                          <td className="py-3 px-4">Language preference</td>
                          <td className="py-3 px-4">1 year</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-3 px-4">_analytics</td>
                          <td className="py-3 px-4">Analytics tracking</td>
                          <td className="py-3 px-4">1 year</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">4. Third-Party Cookies</h2>
                  <p className="text-muted-foreground">
                    Some cookies on our website are set by third-party services that appear on our pages. We use 
                    services from trusted partners for analytics and functionality. These third parties may use 
                    cookies to collect information about your activities on our website and other websites.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">5. Managing Cookies</h2>
                  <p className="text-muted-foreground mb-3">
                    You can control and manage cookies in various ways:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Browser settings: Most browsers allow you to refuse or accept cookies</li>
                    <li>Browser extensions: You can install browser extensions to block cookies</li>
                    <li>Opt-out links: Some third-party services provide opt-out mechanisms</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    Please note that blocking certain cookies may impact your experience on our website and limit 
                    the services we can offer you.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">6. Do Not Track Signals</h2>
                  <p className="text-muted-foreground">
                    Some browsers have a "Do Not Track" feature that signals to websites that you do not want to 
                    have your online activity tracked. We currently respond to "Do Not Track" signals by disabling 
                    non-essential cookies when such signals are detected.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">7. Updates to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this Cookie Policy from time to time to reflect changes in technology, regulation, 
                    or our data practices. Any changes will be posted on this page with an updated revision date.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact Us</h2>
                  <p className="text-muted-foreground">
                    If you have questions about our use of cookies, please contact us at:
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

export default Cookies;
