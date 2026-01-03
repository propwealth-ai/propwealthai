-- Create function to handle commission updates when a user upgrades to Pro
CREATE OR REPLACE FUNCTION public.handle_pro_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_record RECORD;
  commission DECIMAL := 5.00; -- Default commission amount
BEGIN
  -- Only trigger when plan_type changes to 'pro' and payment is active
  IF NEW.plan_type = 'pro' AND NEW.payment_status = 'active' 
     AND (OLD.plan_type IS DISTINCT FROM 'pro' OR OLD.payment_status IS DISTINCT FROM 'active') THEN
    
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

-- Create trigger to fire on profile updates
DROP TRIGGER IF EXISTS on_user_upgrade_to_pro ON public.profiles;
CREATE TRIGGER on_user_upgrade_to_pro
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_pro_upgrade();