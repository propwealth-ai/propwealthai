-- Fix the handle_new_user trigger to save referred_by and create affiliate referral
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  new_team_id UUID;
  referral_code_value TEXT;
  referrer_profile_id UUID;
BEGIN
  -- Get referral code from metadata
  referral_code_value := NEW.raw_user_meta_data ->> 'referred_by';
  
  -- Create a new team for the user
  INSERT INTO public.teams (name)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'My Team') || '''s Team')
  RETURNING id INTO new_team_id;
  
  -- Create profile linked to the team with referred_by
  INSERT INTO public.profiles (id, email, full_name, team_id, team_role, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    new_team_id,
    'owner',
    referral_code_value
  );
  
  -- If there's a referral code, create the affiliate referral record
  IF referral_code_value IS NOT NULL AND referral_code_value != '' THEN
    -- Find the referrer by their referral code (must be an influencer)
    SELECT id INTO referrer_profile_id
    FROM public.profiles
    WHERE referral_code = referral_code_value
      AND is_influencer = true
    LIMIT 1;
    
    -- If referrer found, create the affiliate referral
    IF referrer_profile_id IS NOT NULL THEN
      INSERT INTO public.affiliate_referrals (referrer_id, referred_id, commission_amount, status)
      VALUES (referrer_profile_id, NEW.id, 0, 'pending');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;