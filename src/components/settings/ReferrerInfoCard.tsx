import React, { useEffect, useState } from 'react';
import { UserCheck, Star, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ReferrerProfile {
  id: string;
  full_name: string | null;
  email: string;
  referral_code: string | null;
  is_influencer: boolean;
}

const ReferrerInfoCard: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();
  const [referrer, setReferrer] = useState<ReferrerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferrer = async () => {
      if (!profile?.referred_by) {
        setLoading(false);
        return;
      }

      try {
        // Find the referrer by their referral_code
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, referral_code, is_influencer')
          .eq('referral_code', profile.referred_by)
          .single();

        if (error) {
          console.error('Error fetching referrer:', error);
        } else {
          setReferrer(data);
        }
      } catch (err) {
        console.error('Failed to fetch referrer:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrer();
  }, [profile?.referred_by]);

  // Don't show if user wasn't referred
  if (!profile?.referred_by && !loading) {
    return null;
  }

  return (
    <div className="glass-card p-6">
      <div className={cn("flex items-center gap-3 mb-6", isRTL && "flex-row-reverse")}>
        <UserCheck className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">{t('settings.referredBy') || 'Referred By'}</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : referrer ? (
        <div className={cn(
          "flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20",
          isRTL && "flex-row-reverse"
        )}>
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-primary-foreground">
              {referrer.full_name?.charAt(0)?.toUpperCase() || referrer.email.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
              <h3 className="text-lg font-semibold text-foreground truncate">
                {referrer.full_name || t('common.unknown') || 'Unknown'}
              </h3>
              {referrer.is_influencer && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                  <Star className="w-3 h-3" />
                  {t('admin.partner') || 'Partner'}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {referrer.email}
            </p>
            <div className={cn("flex items-center gap-2 mt-2", isRTL && "flex-row-reverse justify-end")}>
              <span className="text-xs text-muted-foreground">
                {t('referral.yourCode') || 'Referral Code'}:
              </span>
              <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {referrer.referral_code}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={cn(
          "flex items-center gap-3 p-4 bg-secondary/50 rounded-lg text-muted-foreground",
          isRTL && "flex-row-reverse"
        )}>
          <Users className="w-5 h-5" />
          <span>{t('settings.referrerNotFound') || 'Referrer information not available'}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        {t('settings.referralNote') || 'You were referred to PropWealth AI by this partner.'}
      </p>
    </div>
  );
};

export default ReferrerInfoCard;
