-- Create a trigger to update available_balance when commission is paid
CREATE OR REPLACE FUNCTION public.update_influencer_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a referral status changes to 'paid', add commission to influencer's balance
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    UPDATE public.profiles
    SET available_balance = COALESCE(available_balance, 0) + NEW.commission_amount
    WHERE id = NEW.referrer_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on affiliate_referrals
DROP TRIGGER IF EXISTS on_referral_paid ON public.affiliate_referrals;
CREATE TRIGGER on_referral_paid
AFTER INSERT OR UPDATE ON public.affiliate_referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_influencer_balance();