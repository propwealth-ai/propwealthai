-- Create commission_settings table
CREATE TABLE public.commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type text NOT NULL UNIQUE,
  commission_amount numeric NOT NULL DEFAULT 5.00,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read commission settings (public info)
CREATE POLICY "Anyone can view commission settings"
ON public.commission_settings
FOR SELECT
USING (true);

-- Only admins can manage commission settings
CREATE POLICY "Admins can manage commission settings"
ON public.commission_settings
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Insert default commission values
INSERT INTO public.commission_settings (plan_type, commission_amount) VALUES
  ('pro', 5.00),
  ('business', 15.00),
  ('enterprise', 50.00);

-- Update handle_pro_upgrade to use dynamic commission from settings table
CREATE OR REPLACE FUNCTION public.handle_pro_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_record RECORD;
  commission DECIMAL;
BEGIN
  -- Only trigger when plan_type changes to a paid plan and payment is active
  IF NEW.plan_type IN ('pro', 'business', 'enterprise') 
     AND NEW.payment_status = 'active' 
     AND (OLD.plan_type IS DISTINCT FROM NEW.plan_type OR OLD.payment_status IS DISTINCT FROM 'active') THEN
    
    -- Get commission amount from settings table
    SELECT commission_amount INTO commission
    FROM public.commission_settings
    WHERE plan_type = NEW.plan_type
      AND is_active = true
    LIMIT 1;
    
    -- Default to 5.00 if no setting found
    IF commission IS NULL THEN
      commission := 5.00;
    END IF;
    
    -- Find pending referral for this user
    SELECT ar.*, p.referral_code as referrer_code
    INTO referrer_record
    FROM public.affiliate_referrals ar
    JOIN public.profiles p ON p.id = ar.referrer_id
    WHERE ar.referred_id = NEW.id
      AND ar.status = 'pending'
    LIMIT 1;
    
    -- If found, update the commission
    IF FOUND THEN
      UPDATE public.affiliate_referrals
      SET commission_amount = commission,
          status = 'paid'
      WHERE id = referrer_record.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_commission_settings_updated_at
BEFORE UPDATE ON public.commission_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();