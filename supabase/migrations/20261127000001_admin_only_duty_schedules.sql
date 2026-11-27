-- Managers retain read access to their office's schedules, but only admins
-- can change them. This closes the remaining write policy from
-- 20260611000001_team_lead_office_scoped_admin_access.
DROP POLICY IF EXISTS "Team leads can manage office duty schedules" ON public.duty_schedules;

DROP POLICY IF EXISTS "Team leads can view office duty schedules" ON public.duty_schedules;
CREATE POLICY "Team leads can view office duty schedules" ON public.duty_schedules
  FOR SELECT TO authenticated
  USING (
    public.is_team_lead_for_office(auth.uid(), office_id)
    AND public.is_team_lead_for_employee(auth.uid(), employee_id)
  );

-- The profile trigger already rejects changes to other users by non-admins.
-- Remove the obsolete manager UPDATE policy as defense in depth; the existing
-- self-update policy still allows a user to edit their own name and photo.
DROP POLICY IF EXISTS "Team leads can update office profiles" ON public.profiles;
