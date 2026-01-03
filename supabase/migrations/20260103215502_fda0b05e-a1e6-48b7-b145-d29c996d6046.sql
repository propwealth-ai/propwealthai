-- Create withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount >= 50),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  payment_method TEXT,
  payment_details JSONB DEFAULT '{}'::jsonb,
  admin_notes TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Influencers can view their own withdrawal requests
CREATE POLICY "Influencers can view their own withdrawals"
ON public.withdrawal_requests
FOR SELECT
USING (influencer_id = auth.uid());

-- Influencers can insert withdrawal requests
CREATE POLICY "Influencers can create withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (influencer_id = auth.uid());

-- Admins can view all withdrawal requests
CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawal_requests
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update withdrawal requests
CREATE POLICY "Admins can update withdrawals"
ON public.withdrawal_requests
FOR UPDATE
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add available_balance column to track influencer balance
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS available_balance NUMERIC DEFAULT 0;