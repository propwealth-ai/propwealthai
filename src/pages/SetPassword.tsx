import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SetPassword: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get team name
  const [teamName, setTeamName] = useState<string>('');

  useEffect(() => {
    if (profile?.team_id) {
      fetchTeamName();
    }
  }, [profile?.team_id]);

  useEffect(() => {
    // If user doesn't need to change password, redirect to dashboard
    if (user && profile && !profile.must_change_password) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, profile, navigate]);

  const fetchTeamName = async () => {
    if (!profile?.team_id) return;
    
    const { data } = await supabase
      .from('teams')
      .select('name')
      .eq('id', profile.team_id)
      .single();
    
    if (data) {
      setTeamName(data.name);
    }
  };

  const passwordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: t('auth.weak'), color: 'bg-destructive' };
    if (score <= 4) return { score, label: t('auth.medium'), color: 'bg-amber-500' };
    return { score, label: t('auth.strong'), color: 'bg-primary' };
  };

  const strength = passwordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordsDoNotMatch'),
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordTooShort'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      // Update profile to remove must_change_password flag
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Refresh profile
      await refreshProfile();

      toast({
        title: t('common.success'),
        description: t('auth.passwordUpdated'),
      });

      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('auth.passwordUpdateFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className={cn(
        "w-full max-w-md",
        isRTL && "rtl"
      )}>
        {/* Welcome Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t('auth.welcomeToTeam')}
            </h1>
            {teamName && (
              <p className="text-xl text-primary font-semibold mb-4">
                {teamName}
              </p>
            )}
            <p className="text-muted-foreground">
              {t('auth.setSecurePassword')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t('auth.newPassword')}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-executive pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          i <= strength.score ? strength.color : "bg-secondary"
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn(
                    "text-xs",
                    strength.score <= 2 ? "text-destructive" : 
                    strength.score <= 4 ? "text-amber-500" : "text-primary"
                  )}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "input-executive pr-10",
                    confirmPassword && (passwordsMatch ? "border-primary" : "border-destructive")
                  )}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && (
                <p className={cn(
                  "text-xs mt-1 flex items-center gap-1",
                  passwordsMatch ? "text-primary" : "text-destructive"
                )}>
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      {t('auth.passwordsMatch')}
                    </>
                  ) : (
                    t('auth.passwordsDoNotMatch')
                  )}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full btn-premium text-primary-foreground h-12 text-base"
              disabled={loading || !passwordsMatch || strength.score < 3}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {t('auth.setPasswordAndContinue')}
                </>
              )}
            </Button>
          </form>

          {/* Security Note */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            {t('auth.securityNote')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
