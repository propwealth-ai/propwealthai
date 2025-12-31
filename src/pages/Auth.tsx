import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: t('common.error'),
              description: 'This email is already registered. Please sign in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: t('common.error'),
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: t('common.success'),
            description: 'Account created successfully! Redirecting...',
          });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: t('common.error'),
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    } catch (err) {
      toast({
        title: t('common.error'),
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className={cn(
        "hidden lg:flex lg:w-1/2 relative overflow-hidden",
        isRTL && "order-2"
      )}>
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background"></div>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(hsla(160, 84%, 39%, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, hsla(160, 84%, 39%, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center animate-pulse-glow">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">PropWealth</h1>
              <p className="text-muted-foreground">AI Investment OS</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-4">
            From <span className="text-money">$30K</span> to <span className="text-gold">$1M</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            The complete operating system for real estate investors. AI-powered analysis, 
            team collaboration, and world-class education.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { number: '10K+', label: 'Properties Analyzed' },
              { number: '$2.5B', label: 'Portfolio Value' },
              { number: '50+', label: 'Countries' },
              { number: '98%', label: 'Success Rate' },
            ].map((stat, index) => (
              <div 
                key={index} 
                className="glass-card p-4 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="text-2xl font-bold text-money">{stat.number}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className={cn(
        "w-full lg:w-1/2 flex items-center justify-center p-8",
        isRTL && "order-1"
      )}>
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">PropWealth</h1>
              <p className="text-xs text-muted-foreground">AI Investment OS</p>
            </div>
          </div>

          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isSignUp 
                ? 'Start your journey to real estate wealth'
                : 'Welcome back to your investment dashboard'
              }
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="relative">
                  <User className={cn(
                    "absolute top-3 w-5 h-5 text-muted-foreground",
                    isRTL ? "right-3" : "left-3"
                  )} />
                  <Input
                    type="text"
                    placeholder={t('auth.fullName')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={cn("input-executive h-12", isRTL ? "pr-10" : "pl-10")}
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className={cn(
                  "absolute top-3 w-5 h-5 text-muted-foreground",
                  isRTL ? "right-3" : "left-3"
                )} />
                <Input
                  type="email"
                  placeholder={t('auth.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("input-executive h-12", isRTL ? "pr-10" : "pl-10")}
                  required
                />
              </div>

              <div className="relative">
                <Lock className={cn(
                  "absolute top-3 w-5 h-5 text-muted-foreground",
                  isRTL ? "right-3" : "left-3"
                )} />
                <Input
                  type="password"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn("input-executive h-12", isRTL ? "pr-10" : "pl-10")}
                  required
                  minLength={6}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 btn-premium text-primary-foreground font-semibold"
                disabled={loading}
              >
                {loading ? t('common.loading') : (
                  <span className="flex items-center justify-center gap-2">
                    {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:underline font-medium"
                >
                  {isSignUp ? t('auth.signIn') : t('auth.signUp')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
