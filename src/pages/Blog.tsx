import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const LOGO_URL = "https://ik.imagekit.io/PropWealthAI/PropWealth%20AI%20/logo%20ofial%20propwealth%202%20-%20Copia%20(1)%20-%20Copia.png?updatedAt=1767203215713";

const Blog: React.FC = () => {
  const { t } = useLanguage();

  const posts = [
    {
      title: 'How AI is Transforming Real Estate Investment Analysis',
      excerpt: 'Discover how artificial intelligence is revolutionizing the way investors analyze properties and make decisions.',
      author: 'PropWealth AI Team',
      date: 'January 5, 2025',
      category: 'Technology',
      readTime: '5 min read'
    },
    {
      title: 'The Complete Guide to Cap Rate Analysis',
      excerpt: 'Learn everything you need to know about capitalization rates and how to use them in your investment decisions.',
      author: 'PropWealth AI Team',
      date: 'January 3, 2025',
      category: 'Education',
      readTime: '8 min read'
    },
    {
      title: 'Building Your First Real Estate Portfolio: From $30K to $1M',
      excerpt: 'A step-by-step guide to building wealth through strategic real estate investments.',
      author: 'PropWealth AI Team',
      date: 'December 28, 2024',
      category: 'Strategy',
      readTime: '12 min read'
    },
    {
      title: 'Understanding Cash-on-Cash Returns',
      excerpt: 'Master the art of calculating and interpreting cash-on-cash returns for rental properties.',
      author: 'PropWealth AI Team',
      date: 'December 20, 2024',
      category: 'Education',
      readTime: '6 min read'
    },
    {
      title: 'Top 10 Markets for Real Estate Investment in 2025',
      excerpt: 'Our AI-powered analysis of the hottest real estate markets for the coming year.',
      author: 'PropWealth AI Team',
      date: 'December 15, 2024',
      category: 'Market Analysis',
      readTime: '10 min read'
    }
  ];

  const categories = ['All', 'Technology', 'Education', 'Strategy', 'Market Analysis'];

  return (
    <>
      <Helmet>
        <title>Blog | PropWealth AI - Real Estate Investment Insights</title>
        <meta name="description" content="Expert insights on real estate investing, AI technology, market analysis, and wealth-building strategies from the PropWealth AI team." />
        <link rel="canonical" href="https://www.propwealthai.com/blog" />
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
              PropWealth AI Blog
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Expert insights on real estate investing, AI technology, and wealth-building strategies.
            </p>
          </div>
        </section>

        {/* Categories */}
        <section className="py-3 sm:py-4 px-4 sm:px-6 border-b border-border/50">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
              {categories.map((category, index) => (
                <Button
                  key={index}
                  variant={index === 0 ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full text-xs sm:text-sm px-3 sm:px-4"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="space-y-8">
              {posts.map((post, index) => (
                <article key={index} className="glass-card p-6 hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2 hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {post.date}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1">
                      Read More <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-muted-foreground mb-6">
              Get the latest insights on real estate investing delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button>Subscribe</Button>
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

export default Blog;
