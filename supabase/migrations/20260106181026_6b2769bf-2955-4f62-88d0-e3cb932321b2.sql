-- Add RLS policy to allow users to insert their own referral records
CREATE POLICY "Users can create referrals for themselves"
ON public.affiliate_referrals
FOR INSERT
WITH CHECK (referred_id = auth.uid());