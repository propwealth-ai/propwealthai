-- Create enum for user roles in the team
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'shark_agent', 'contractor', 'lender', 'attorney', 'inspector', 'member');

-- Create enum for property status
CREATE TYPE public.property_status AS ENUM ('new', 'analyzing', 'under_contract', 'acquired', 'archived');

-- Create enum for supported languages
CREATE TYPE public.language_code AS ENUM ('en', 'pt', 'fr', 'zh', 'it', 'es', 'ar');

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  team_role team_role NOT NULL DEFAULT 'member',
  language_pref language_code NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  property_type TEXT,
  purchase_price NUMERIC,
  current_value NUMERIC,
  monthly_rent NUMERIC,
  monthly_expenses NUMERIC,
  financial_data JSONB DEFAULT '{}',
  status property_status NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course progress table
CREATE TABLE public.course_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id, lesson_id)
);

-- Create team invitations table
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role team_role NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create function to get user's team_id
CREATE OR REPLACE FUNCTION public.get_user_team_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.profiles WHERE id = user_id;
$$;

-- Create function to check if user is team owner
CREATE OR REPLACE FUNCTION public.is_team_owner(user_id UUID, check_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND team_id = check_team_id 
    AND team_role = 'owner'
  );
$$;

-- Teams policies
CREATE POLICY "Users can view their own team"
ON public.teams FOR SELECT
USING (id = public.get_user_team_id(auth.uid()));

CREATE POLICY "Users can create teams"
ON public.teams FOR INSERT
WITH CHECK (true);

CREATE POLICY "Team owners can update their team"
ON public.teams FOR UPDATE
USING (public.is_team_owner(auth.uid(), id));

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can view team members profiles"
ON public.profiles FOR SELECT
USING (team_id = public.get_user_team_id(auth.uid()));

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- Properties policies (team-based isolation)
CREATE POLICY "Users can view team properties"
ON public.properties FOR SELECT
USING (team_id = public.get_user_team_id(auth.uid()));

CREATE POLICY "Users can insert team properties"
ON public.properties FOR INSERT
WITH CHECK (team_id = public.get_user_team_id(auth.uid()));

CREATE POLICY "Users can update team properties"
ON public.properties FOR UPDATE
USING (team_id = public.get_user_team_id(auth.uid()));

CREATE POLICY "Users can delete team properties"
ON public.properties FOR DELETE
USING (team_id = public.get_user_team_id(auth.uid()));

-- Course progress policies
CREATE POLICY "Users can view their own progress"
ON public.course_progress FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own progress"
ON public.course_progress FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
ON public.course_progress FOR UPDATE
USING (user_id = auth.uid());

-- Team invitations policies
CREATE POLICY "Team owners can view invitations"
ON public.team_invitations FOR SELECT
USING (team_id = public.get_user_team_id(auth.uid()));

CREATE POLICY "Team owners can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (public.is_team_owner(auth.uid(), team_id));

CREATE POLICY "Anyone can view invitation by token"
ON public.team_invitations FOR SELECT
USING (true);

-- Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_team_id UUID;
BEGIN
  -- Create a new team for the user
  INSERT INTO public.teams (name)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'My Team') || '''s Team')
  RETURNING id INTO new_team_id;
  
  -- Create profile linked to the team
  INSERT INTO public.profiles (id, email, full_name, team_id, team_role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    new_team_id,
    'owner'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();