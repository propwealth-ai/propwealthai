import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Check, X, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const ReferralCodeInput: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [referralCode, setReferralCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);

  const applyReferralMutation = useMutation({
    mutationFn: async (code: string) => {
      // Validate the referral code exists
      const { data: influencer, error: findError } = await supabase
        .from('profiles')
        .select('id, referral_code, full_name')
        .eq('referral_code', code.toUpperCase())
        .eq('is_influencer', true)
        .maybeSingle();

      if (findError) throw findError;
      if (!influencer) {
        throw new Error('Invalid referral code');
      }

      // Apply the referral code to the current user
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ referred_by: code.toUpperCase() })
        .eq('id', profile?.id);

      if (updateError) throw updateError;

      // Create affiliate referral record
      const { error: referralError } = await supabase
        .from('affiliate_referrals')
        .insert({
          referrer_id: influencer.id,
          referred_id: profile?.id,
          commission_amount: 0,
          status: 'pending'
        });

      if (referralError) {
        console.error('Error creating affiliate referral:', referralError);
        // Don't throw - the referral code was still applied
      }

      return influencer;
    },
    onSuccess: (influencer) => {
      toast({
        title: t('referral.applied'),
        description: t('referral.appliedDesc').replace('{name}', influencer.full_name || 'Partner'),
      });
      setValidationResult('valid');
      refreshProfile?.();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      setValidationResult('invalid');
      toast({
        title: t('common.error'),
        description: error.message === 'Invalid referral code' 
          ? t('referral.invalidCode') 
          : t('referral.applyError'),
        variant: 'destructive',
      });
    },
  });

  const handleValidate = async () => {
    if (!referralCode.trim()) return;
    
    setIsValidating(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('referral_code', referralCode.toUpperCase())
        .eq('is_influencer', true)
        .maybeSingle();

      if (error) throw error;
      setValidationResult(data ? 'valid' : 'invalid');
    } catch (error) {
      setValidationResult('invalid');
    } finally {
      setIsValidating(false);
    }
  };

  const handleApply = () => {
    if (validationResult === 'valid') {
      applyReferralMutation.mutate(referralCode);
    }
  };

  // If user already has a referral code applied
  if (profile?.referred_by) {
    return (
      <div className="glass-card p-6">
        <div className={cn("flex items-center gap-3 mb-4", isRTL && "flex-row-reverse")}>
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{t('referral.title')}</h3>
        </div>
        <div className={cn("flex items-center gap-3 p-4 bg-success/10 rounded-lg border border-success/20", isRTL && "flex-row-reverse")}>
          <Check className="w-5 h-5 text-success" />
          <div className={isRTL ? "text-right" : ""}>
            <p className="font-medium text-foreground">{t('referral.alreadyApplied')}</p>
            <p className="text-sm text-muted-foreground">
              {t('referral.yourCode')}: <span className="font-mono text-primary">{profile.referred_by}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className={cn("flex items-center gap-3 mb-4", isRTL && "flex-row-reverse")}>
        <Gift className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">{t('referral.title')}</h3>
      </div>
      
      <p className="text-muted-foreground mb-4">{t('referral.description')}</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t('referral.enterCode')}</Label>
          <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
            <div className="relative flex-1">
              <Tag className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <Input
                value={referralCode}
                onChange={(e) => {
                  setReferralCode(e.target.value.toUpperCase());
                  setValidationResult(null);
                }}
                placeholder="MARKETINGGURU"
                className={cn(
                  "input-executive font-mono",
                  isRTL ? "pr-10" : "pl-10",
                  validationResult === 'valid' && "border-success",
                  validationResult === 'invalid' && "border-destructive"
                )}
              />
              {validationResult && (
                <div className={cn("absolute top-1/2 -translate-y-1/2", isRTL ? "left-3" : "right-3")}>
                  {validationResult === 'valid' ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <X className="w-4 h-4 text-destructive" />
                  )}
                </div>
              )}
            </div>
            {validationResult !== 'valid' ? (
              <Button 
                onClick={handleValidate}
                disabled={!referralCode.trim() || isValidating}
                variant="outline"
                className="border-primary/50 text-primary"
              >
                {isValidating ? t('common.loading') : t('referral.validate')}
              </Button>
            ) : (
              <Button 
                onClick={handleApply}
                disabled={applyReferralMutation.isPending}
                className="btn-premium text-primary-foreground"
              >
                {applyReferralMutation.isPending ? t('common.loading') : t('referral.apply')}
              </Button>
            )}
          </div>
        </div>

        {validationResult === 'valid' && (
          <div className={cn("flex items-center gap-2 text-sm text-success", isRTL && "flex-row-reverse")}>
            <Check className="w-4 h-4" />
            <span>{t('referral.validCode')}</span>
          </div>
        )}

        {validationResult === 'invalid' && (
          <div className={cn("flex items-center gap-2 text-sm text-destructive", isRTL && "flex-row-reverse")}>
            <X className="w-4 h-4" />
            <span>{t('referral.invalidCode')}</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {t('referral.note')}
        </p>
      </div>
    </div>
  );
};

export default ReferralCodeInput;
