-- Fix RLS policy for user_roles table to allow role assignment during employee creation
-- This allows admins to insert roles for new users

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Drop policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create more specific policies for user_roles
CREATE POLICY "Admins can insert roles for any user" ON public.user_roles
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles for any user" ON public.user_roles
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles for any user" ON public.user_roles
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to view all roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
