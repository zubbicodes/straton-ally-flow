CREATE OR REPLACE FUNCTION public.same_office(_user_a uuid, _user_b uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees ea
    JOIN public.employees eb ON ea.office_id = eb.office_id
    WHERE ea.user_id = _user_a
      AND eb.user_id = _user_b
      AND ea.office_id IS NOT NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.same_office(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Employees can view office profiles" ON public.profiles;

CREATE POLICY "Employees can view office profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR auth.uid() = id
    OR public.same_office(auth.uid(), id)
  );
