-- Managers ("team leads") keep VIEW access to their own office, but only admins
-- can change offices' settings (attendance location, geofence, IP rules, hours),
-- office departments, access control and employee records.
--
-- Replaces the write side of 20260611000001_team_lead_office_scoped_admin_access.
-- Admin policies ("Admins can manage ...") are untouched. Employees keep their own
-- limited self-edit (policy "Users can update own employee record" + the
-- aa_guard_employee_update column guard).

-- office_settings: was ALL for team leads; read access stays via
-- "Users can view assigned office settings".
DROP POLICY IF EXISTS "Team leads can manage assigned office settings" ON public.office_settings;

-- office_departments: same; read stays via "Users can view assigned office departments".
DROP POLICY IF EXISTS "Team leads can manage assigned office departments" ON public.office_departments;

-- access_control: was ALL for team leads; keep read-only for their office.
DROP POLICY IF EXISTS "Team leads can manage office access control" ON public.access_control;
DROP POLICY IF EXISTS "Team leads can view office access control" ON public.access_control;
CREATE POLICY "Team leads can view office access control" ON public.access_control
  FOR SELECT TO authenticated
  USING (
    public.is_team_lead_for_office(auth.uid(), office_id)
    AND public.is_team_lead_for_employee(auth.uid(), employee_id)
  );

-- employees: team leads could insert, update and delete records in their office.
-- Read access stays ("Team leads can view office employees",
-- "Managers can view managed employee records").
DROP POLICY IF EXISTS "Team leads can insert office employees" ON public.employees;
DROP POLICY IF EXISTS "Team leads can update office employees" ON public.employees;
DROP POLICY IF EXISTS "Team leads can delete office employees" ON public.employees;

-- profiles: managers could activate/deactivate accounts of people in their office.
-- Now only admins can; everyone can still change their own name and photo.
CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  self_cols text[] := ARRAY['full_name','avatar_url','updated_at'];
BEGIN
  IF uid IS NULL OR public.has_role(uid, 'admin') THEN
    RETURN NEW;
  END IF;

  IF OLD.id = uid THEN
    IF (to_jsonb(NEW) - self_cols) IS DISTINCT FROM (to_jsonb(OLD) - self_cols) THEN
      RAISE EXCEPTION 'You can only change your name and photo' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Only admins can change other people''s profiles' USING ERRCODE = '42501';
END;
$$;
