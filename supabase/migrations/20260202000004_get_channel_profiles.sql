CREATE OR REPLACE FUNCTION public.get_channel_profiles(_channel_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _office_id uuid;
  _is_private boolean;
  _caller_office_id uuid;
BEGIN
  SELECT office_id, is_private
  INTO _office_id, _is_private
  FROM public.work_channels
  WHERE work_channels.id = _channel_id;

  IF _office_id IS NULL THEN
    RETURN;
  END IF;

  SELECT office_id
  INTO _caller_office_id
  FROM public.employees
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF NOT public.has_role(auth.uid(), 'admin') AND _caller_office_id IS DISTINCT FROM _office_id AND NOT EXISTS (
    SELECT 1
    FROM public.work_channel_members m
    WHERE m.channel_id = _channel_id
      AND m.user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  IF _is_private THEN
    RETURN QUERY
      SELECT p.id, p.full_name, p.email, p.avatar_url
      FROM public.work_channel_members m
      JOIN public.profiles p ON p.id = m.user_id
      WHERE m.channel_id = _channel_id
      ORDER BY p.full_name;
  ELSE
    RETURN QUERY
      SELECT p.id, p.full_name, p.email, p.avatar_url
      FROM public.employees e
      JOIN public.profiles p ON p.id = e.user_id
      WHERE e.office_id = _office_id
      ORDER BY p.full_name;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_channel_profiles(uuid) TO authenticated;
