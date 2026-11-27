-- Managers can view their office but not change org settings (migration 20261126000002).
-- Run against a disposable copy of the database; everything rolls back.
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/org_edit_checks.sql
BEGIN;

CREATE TEMP TABLE results (name text, ok boolean) ON COMMIT DROP;
GRANT ALL ON results TO PUBLIC;

-- A team-lead manager who is not an admin, their office, and someone in that office.
CREATE TEMP TABLE ids AS
SELECT e.user_id AS lead_user, e.office_id AS office,
       (SELECT o.id FROM public.employees o WHERE o.office_id = e.office_id AND o.user_id <> e.user_id ORDER BY o.id LIMIT 1) AS colleague,
       (SELECT r.user_id FROM public.user_roles r WHERE r.role = 'admin' LIMIT 1) AS admin_user
FROM public.employees e
WHERE e.is_team_lead AND e.office_id IS NOT NULL
  AND NOT public.has_role(e.user_id, 'admin')
ORDER BY e.employee_id LIMIT 1;
GRANT SELECT ON ids TO PUBLIC;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT lead_user FROM ids), 'role', 'authenticated')::text, true);

INSERT INTO results SELECT 'manager can view office settings',
  EXISTS (SELECT 1 FROM public.office_settings s WHERE s.office_id = (SELECT office FROM ids));
INSERT INTO results SELECT 'manager can view office employees',
  EXISTS (SELECT 1 FROM public.employees e WHERE e.id = (SELECT colleague FROM ids));

WITH u AS (UPDATE public.office_settings SET geo_fencing_enabled = NOT geo_fencing_enabled
            WHERE office_id = (SELECT office FROM ids) RETURNING 1)
INSERT INTO results SELECT 'manager cannot change attendance location rules', count(*) = 0 FROM u;

WITH u AS (UPDATE public.office_departments SET office_id = office_id
            WHERE office_id = (SELECT office FROM ids) RETURNING 1)
INSERT INTO results SELECT 'manager cannot change office departments', count(*) = 0 FROM u;

WITH u AS (UPDATE public.duty_schedules SET office_id = office_id
            WHERE office_id = (SELECT office FROM ids) RETURNING 1)
INSERT INTO results SELECT 'manager cannot change duty schedules', count(*) = 0 FROM u;

WITH u AS (UPDATE public.access_control SET is_active = is_active RETURNING 1)
INSERT INTO results SELECT 'manager cannot change access control', count(*) = 0 FROM u;

WITH u AS (UPDATE public.employees SET designation = designation
            WHERE id = (SELECT colleague FROM ids) RETURNING 1)
INSERT INTO results SELECT 'manager cannot edit a colleague', count(*) = 0 FROM u;

WITH d AS (DELETE FROM public.employees WHERE id = (SELECT colleague FROM ids) RETURNING 1)
INSERT INTO results SELECT 'manager cannot delete a colleague', count(*) = 0 FROM d;

DO $$ BEGIN
  INSERT INTO public.employees (user_id, employee_id, office_id, joining_date)
  SELECT lead_user, 'ZZ-TEST', office, current_date FROM ids;
  INSERT INTO results VALUES ('manager cannot add employees', false);
EXCEPTION WHEN insufficient_privilege OR not_null_violation OR unique_violation OR check_violation OR foreign_key_violation THEN
  INSERT INTO results VALUES ('manager cannot add employees', true);
END $$;
DO $$ DECLARE n int; BEGIN
  UPDATE public.profiles SET status = status
   WHERE id = (SELECT e.user_id FROM public.employees e WHERE e.id = (SELECT colleague FROM ids));
  GET DIAGNOSTICS n = ROW_COUNT;  -- 0 rows means RLS hid it, which also counts as blocked
  INSERT INTO results VALUES ('manager cannot activate or deactivate a colleague', n = 0);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO results VALUES ('manager cannot activate or deactivate a colleague', true);
END $$;
RESET ROLE;

-- admin still can
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT admin_user FROM ids), 'role', 'authenticated')::text, true);
WITH u AS (UPDATE public.office_settings SET geo_fencing_enabled = geo_fencing_enabled
            WHERE office_id = (SELECT office FROM ids) RETURNING 1)
INSERT INTO results SELECT 'admin can change attendance location rules', count(*) = 1 FROM u;
WITH u AS (UPDATE public.employees SET designation = designation
            WHERE id = (SELECT colleague FROM ids) RETURNING 1)
INSERT INTO results SELECT 'admin can edit employees', count(*) = 1 FROM u;
RESET ROLE;

INSERT INTO results SELECT 'manager schedule write policy removed', NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'duty_schedules'
    AND policyname = 'Team leads can manage office duty schedules'
);
INSERT INTO results SELECT 'manager retains schedule read policy', EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'duty_schedules'
    AND policyname = 'Team leads can view office duty schedules' AND cmd = 'SELECT'
);
INSERT INTO results SELECT 'manager profile write policy removed', NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles'
    AND policyname = 'Team leads can update office profiles'
);

SELECT CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS result, name FROM results;
SELECT count(*) FILTER (WHERE NOT ok) AS failures, count(*) AS total FROM results;
ROLLBACK;
