import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Tag, CheckCircle, TrendingUp, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const LOGO_URL = "https://ik.imagekit.io/PropWealthAI/PropWealth%20AI%20/logo%20ofial%20propwealth%202%20-%20Copia%20(1)%20-%20Copia.png?updatedAt=1767203215713";

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auto-populate referral code from URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      setIsSignUp(true); // Switch to signup if referral code present
    }
  }, [searchParams]);

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

  const benefits = [
    { icon: TrendingUp, text: t('auth.benefit1') },
    { icon: Shield, text: t('auth.benefit2') },
    { icon: Zap, text: t('auth.benefit3') },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding & Benefits */}
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

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <img 
              src={LOGO_URL} 
              alt="PropWealth AI Logo" 
              className="w-16 h-16 rounded-2xl object-contain animate-pulse-glow"
            />
            <div>
              <h1 className="text-4xl font-bold text-foreground">PropWealth</h1>
              <p className="text-muted-foreground">AI Investment OS</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-4">
            {t('auth.leftTitle')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t('auth.leftSubtitle')}
          </p>

          {/* Benefits List */}
          <div className="space-y-4 mb-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-600 border-2 border-background flex items-center justify-center text-xs font-bold text-primary-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              "{t('auth.testimonial')}"
            </p>
            <p className="text-xs text-primary mt-1">— {t('auth.testimonialAuthor')}</p>
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
            <img 
              src={LOGO_URL} 
              alt="PropWealth AI Logo" 
              className="w-12 h-12 rounded-xl object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">PropWealth</h1>
              <p className="text-xs text-muted-foreground">AI Investment OS</p>
            </div>
          </div>

          <div className="glass-card p-8 rounded-2xl border border-border/50">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isSignUp 
                ? t('auth.signupSubtitle')
                : t('auth.signinSubtitle')
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

              {/* Referral Code Field - Only on Signup */}
              {isSignUp && (
                <div className="relative">
                  <Tag className={cn(
                    "absolute top-3 w-5 h-5 text-muted-foreground",
                    isRTL ? "right-3" : "left-3"
                  )} />
                  <Input
                    type="text"
                    placeholder={t('auth.referralCodePlaceholder')}
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className={cn("input-executive h-12", isRTL ? "pr-10" : "pl-10")}
                  />
                  {referralCode && (
                    <CheckCircle className="absolute right-3 top-3 w-5 h-5 text-primary" />
                  )}
                </div>
              )}

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

          {/* Footer Note */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            {t('auth.termsNote')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
