-- =====================================================
-- PROPWEALTH AI - SECURITY & RBAC MIGRATION
-- =====================================================

-- 1. Create app_role enum for RBAC
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'lender', 'contractor', 'shark_agent', 'attorney', 'inspector', 'member');
    END IF;
END $$;

-- 2. Create user_roles table (SEPARATE from profiles for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, team_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- 5. Create function to get user role for a team
CREATE OR REPLACE FUNCTION public.get_user_role_in_team(_user_id UUID, _team_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
      AND team_id = _team_id
    LIMIT 1;
$$;

-- 6. Create function to check if user is team owner (using new table)
CREATE OR REPLACE FUNCTION public.is_team_owner_v2(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND team_id = _team_id
          AND role = 'owner'
    )
$$;

-- 7. Add must_change_password column to profiles for first login flow
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- 8. RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view team member roles"
ON public.user_roles
FOR SELECT
USING (team_id = get_user_team_id(auth.uid()));

CREATE POLICY "Team owners can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_team_owner_v2(auth.uid(), team_id));

CREATE POLICY "Team owners can update roles"
ON public.user_roles
FOR UPDATE
USING (is_team_owner_v2(auth.uid(), team_id));

CREATE POLICY "Team owners can delete roles"
ON public.user_roles
FOR DELETE
USING (is_team_owner_v2(auth.uid(), team_id));

-- 9. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, team_id)
SELECT 
    p.id as user_id,
    CASE 
        WHEN p.team_role::text = 'owner' THEN 'owner'::app_role
        WHEN p.team_role::text = 'admin' THEN 'admin'::app_role
        WHEN p.team_role::text = 'lender' THEN 'lender'::app_role
        WHEN p.team_role::text = 'contractor' THEN 'contractor'::app_role
        WHEN p.team_role::text = 'shark_agent' THEN 'shark_agent'::app_role
        WHEN p.team_role::text = 'attorney' THEN 'attorney'::app_role
        WHEN p.team_role::text = 'inspector' THEN 'inspector'::app_role
        ELSE 'member'::app_role
    END as role,
    p.team_id
FROM public.profiles p
WHERE p.team_id IS NOT NULL
ON CONFLICT (user_id, team_id, role) DO NOTHING;

-- 10. Create function to get role permissions (what each role can see)
CREATE OR REPLACE FUNCTION public.get_role_permissions(_role app_role)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE _role
        WHEN 'owner' THEN '{"financial": true, "physical": true, "documents": true, "team": true, "settings": true, "analytics": true}'::jsonb
        WHEN 'admin' THEN '{"financial": true, "physical": true, "documents": true, "team": true, "settings": false, "analytics": true}'::jsonb
        WHEN 'lender' THEN '{"financial": true, "physical": false, "documents": true, "team": false, "settings": false, "analytics": true}'::jsonb
        WHEN 'contractor' THEN '{"financial": false, "physical": true, "documents": false, "team": false, "settings": false, "analytics": false}'::jsonb
        WHEN 'shark_agent' THEN '{"financial": true, "physical": true, "documents": true, "team": false, "settings": false, "analytics": false}'::jsonb
        WHEN 'attorney' THEN '{"financial": false, "physical": false, "documents": true, "team": false, "settings": false, "analytics": false}'::jsonb
        WHEN 'inspector' THEN '{"financial": false, "physical": true, "documents": false, "team": false, "settings": false, "analytics": false}'::jsonb
        ELSE '{"financial": false, "physical": false, "documents": false, "team": false, "settings": false, "analytics": false}'::jsonb
    END
$$;

-- 11. Enable realtime for user_roles
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;