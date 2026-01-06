import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Target, Users, Globe, Award, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const LOGO_URL = "https://ik.imagekit.io/PropWealthAI/PropWealth%20AI%20/logo%20ofial%20propwealth%202%20-%20Copia%20(1)%20-%20Copia.png?updatedAt=1767203215713";

const About: React.FC = () => {
  const { t } = useLanguage();

  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'We believe everyone deserves access to institutional-grade real estate analysis tools, not just the wealthy.'
    },
    {
      icon: Shield,
      title: 'Trust & Transparency',
      description: 'We operate with complete transparency in our algorithms, pricing, and data handling practices.'
    },
    {
      icon: TrendingUp,
      title: 'Innovation First',
      description: 'We continuously push the boundaries of AI technology to deliver cutting-edge investment insights.'
    },
    {
      icon: Globe,
      title: 'Global Perspective',
      description: 'Our platform serves investors worldwide, supporting multiple languages and international markets.'
    }
  ];

  const team = [
    {
      name: 'Leadership Team',
      description: 'Our experienced leadership team brings decades of combined experience in real estate, fintech, and artificial intelligence.'
    },
    {
      name: 'Engineering',
      description: 'World-class engineers building scalable, secure infrastructure to power millions of property analyses.'
    },
    {
      name: 'Data Science',
      description: 'PhD-level researchers developing proprietary AI models for accurate market predictions.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>About Us | PropWealth AI - AI-Powered Real Estate Investment Platform</title>
        <meta name="description" content="Learn about PropWealth AI's mission to democratize real estate investing through artificial intelligence. Meet our team and discover our values." />
        <link rel="canonical" href="https://www.propwealthai.com/about" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <img src={LOGO_URL} alt="PropWealth AI" className="w-10 h-10 rounded-xl object-contain" />
                <span className="text-xl font-bold text-foreground">PropWealth AI</span>
              </Link>
              <Button variant="ghost" asChild>
                <Link to="/" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {t('common.back')}
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About PropWealth AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to democratize real estate investing by making institutional-grade 
              AI analysis accessible to everyone.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="glass-card p-8 md:p-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Our Mission</h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                At PropWealth AI, we believe that building wealth through real estate shouldn't be 
                reserved for those with insider connections or massive capital. Our AI-powered platform 
                analyzes properties in seconds, providing the same caliber of insights that hedge funds 
                and institutional investors use to make billion-dollar decisions.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                Our goal is simple: help you turn $30,000 into $1,000,000 in net worth through 
                strategic real estate investments, powered by artificial intelligence.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-6">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <div key={index} className="glass-card p-6 hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Our Team</h2>
            <div className="space-y-6">
              {team.map((dept, index) => (
                <div key={index} className="glass-card p-6">
                  <div className="flex items-center gap-4 mb-3">
                    <Users className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">{dept.name}</h3>
                  </div>
                  <p className="text-muted-foreground">{dept.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 px-6">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Want to Learn More?</h2>
            <p className="text-muted-foreground mb-6">
              Have questions about our platform or want to explore partnership opportunities?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/careers">Join Our Team</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8">
          <div className="container mx-auto px-6 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PropWealth AI. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              info@propwealthai.com | www.propwealthai.com
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default About;
