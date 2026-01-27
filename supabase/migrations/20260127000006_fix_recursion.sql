-- Fix infinite recursion in user_roles RLS policy
-- The issue was the policy was querying the same table it protects

-- Disable RLS temporarily
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins full access" ON public.user_roles;

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies using the has_role function to avoid recursion
-- Policy 1: Users can view their own roles
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Admins can do everything using the has_role function
CREATE POLICY "Admins full access" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Policy 3: Allow insertion for admins (explicit)
CREATE POLICY "Admins can insert" ON public.user_roles
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy 4: Allow updates for admins (explicit)
CREATE POLICY "Admins can update" ON public.user_roles
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Policy 5: Allow deletes for admins (explicit)
CREATE POLICY "Admins can delete" ON public.user_roles
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
