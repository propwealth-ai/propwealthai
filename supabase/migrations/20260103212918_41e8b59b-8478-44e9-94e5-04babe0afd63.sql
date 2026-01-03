-- Create affiliate_referrals table
CREATE TABLE public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- Enable RLS
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all referrals"
ON public.affiliate_referrals
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage referrals"
ON public.affiliate_referrals
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Influencers can view their own referrals"
ON public.affiliate_referrals
FOR SELECT
USING (referrer_id = auth.uid());

-- Create function to calculate MRR from active subscriptions
CREATE OR REPLACE FUNCTION public.calculate_mrr()
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE 
      WHEN plan_type = 'pro' THEN 29.99
      WHEN plan_type = 'business' THEN 99.99
      WHEN plan_type = 'enterprise' THEN 299.99
      ELSE 0
    END
  ), 0)
  FROM public.profiles
  WHERE payment_status = 'active' AND plan_type != 'free';
$$;

-- Create function to get affiliate stats for an influencer
CREATE OR REPLACE FUNCTION public.get_influencer_stats(influencer_id UUID)
RETURNS TABLE(total_referrals BIGINT, total_earned DECIMAL)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::BIGINT as total_referrals,
    COALESCE(SUM(commission_amount), 0)::DECIMAL as total_earned
  FROM public.affiliate_referrals
  WHERE referrer_id = influencer_id;
$$;