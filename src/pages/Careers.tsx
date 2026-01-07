import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, Clock, DollarSign, Heart, Laptop, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const LOGO_URL = "https://ik.imagekit.io/PropWealthAI/PropWealth%20AI%20/logo%20ofial%20propwealth%202%20-%20Copia%20(1)%20-%20Copia.png?updatedAt=1767203215713";

const Careers: React.FC = () => {
  const { t } = useLanguage();

  const benefits = [
    { icon: DollarSign, title: 'Competitive Salary', description: 'Top-tier compensation packages with equity options' },
    { icon: Heart, title: 'Health Benefits', description: 'Comprehensive medical, dental, and vision coverage' },
    { icon: Laptop, title: 'Remote First', description: 'Work from anywhere in the world' },
    { icon: Users, title: 'Team Culture', description: 'Collaborative environment with talented peers' },
  ];

  const openings = [
    {
      title: 'Senior Full-Stack Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build and scale our AI-powered real estate analysis platform using React, Node.js, and PostgreSQL.'
    },
    {
      title: 'Machine Learning Engineer',
      department: 'Data Science',
      location: 'Remote',
      type: 'Full-time',
      description: 'Develop and optimize ML models for property valuation and market prediction.'
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      description: 'Create intuitive, beautiful interfaces that make complex financial data accessible.'
    },
    {
      title: 'Customer Success Manager',
      department: 'Operations',
      location: 'Remote',
      type: 'Full-time',
      description: 'Help our users succeed in their real estate investment journey with personalized support.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Careers | PropWealth AI - Join Our Team</title>
        <meta name="description" content="Join PropWealth AI and help democratize real estate investing. Explore open positions in engineering, data science, design, and more." />
        <link rel="canonical" href="https://www.propwealthai.com/careers" />
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

        {/* Hero */}
        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Join Our Mission
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Help us democratize real estate investing for millions of people around the world.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-10 sm:py-12 md:py-16 px-4 sm:px-6 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-8 sm:mb-12">Why Work With Us</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="glass-card p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">{benefit.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16 px-6">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">Open Positions</h2>
            <div className="space-y-4">
              {openings.map((job, index) => (
                <div key={index} className="glass-card p-6 hover:border-primary/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{job.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{job.description}</p>
                      <div className="flex flex-wrap gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Briefcase className="w-3 h-3" /> {job.department}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> {job.type}
                        </span>
                      </div>
                    </div>
                    <Button asChild className="shrink-0">
                      <a href={`mailto:careers@propwealthai.com?subject=Application: ${job.title}`}>
                        Apply Now
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Don't See Your Role?</h2>
            <p className="text-muted-foreground mb-6">
              We're always looking for talented people. Send us your resume and tell us how you can contribute.
            </p>
            <Button asChild>
              <a href="mailto:careers@propwealthai.com">
                Send Your Resume
              </a>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8">
          <div className="container mx-auto px-6 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PropWealth AI. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              careers@propwealthai.com | www.propwealthai.com
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Careers;
