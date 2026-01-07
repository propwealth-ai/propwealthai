import React from 'react';
import { Mail, Twitter, Linkedin, Github } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const LOGO_URL = "https://ik.imagekit.io/PropWealthAI/PropWealth%20AI%20/logo%20ofial%20propwealth%202%20-%20Copia%20(1)%20-%20Copia.png?updatedAt=1767203215713";
const Footer: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: t('landing.navFeatures'), href: '#features' },
      { label: t('landing.navPricing'), href: '#pricing' },
      { label: t('landing.footerAcademy'), href: '/academy' },
      { label: t('landing.footerAnalyzer'), href: '/analyzer' },
    ],
    company: [
      { label: t('landing.footerAbout'), href: '/about' },
      { label: t('landing.footerCareers'), href: '/careers' },
      { label: t('landing.footerBlog'), href: '/blog' },
      { label: t('landing.footerContact'), href: '/contact' },
    ],
    legal: [
      { label: t('landing.footerPrivacy'), href: '/privacy' },
      { label: t('landing.footerTerms'), href: '/terms' },
      { label: t('landing.footerCookies'), href: '/cookies' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: '#' },
    { icon: Linkedin, href: '#' },
    { icon: Github, href: '#' },
    { icon: Mail, href: 'mailto:hello@propwealth.ai' },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <img 
                src={LOGO_URL} 
                alt="PropWealth AI Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain"
              />
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">PropWealth AI</h3>
                <p className="text-xs text-muted-foreground">AI Investment OS</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-sm">
              {t('landing.footerTagline')}
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.href}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
                >
                  <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">{t('landing.footerProduct')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">{t('landing.footerCompany')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">{t('landing.footerLegal')}</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 text-center md:text-left">
          <p className="text-xs sm:text-sm text-muted-foreground">
            © {currentYear} PropWealth AI. {t('landing.footerRights')}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('landing.footerPoweredBy')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
