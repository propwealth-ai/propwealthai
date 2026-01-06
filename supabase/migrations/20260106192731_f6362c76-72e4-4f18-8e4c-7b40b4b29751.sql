-- Policy to allow influencers to view basic profile info of users they referred
CREATE POLICY "Influencers can view profiles of users they referred"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_referrals
    WHERE affiliate_referrals.referrer_id = auth.uid()
      AND affiliate_referrals.referred_id = profiles.id
  )
);