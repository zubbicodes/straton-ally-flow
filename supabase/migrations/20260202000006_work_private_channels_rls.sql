DROP POLICY IF EXISTS "Employees can view office channels" ON public.work_channels;
DROP POLICY IF EXISTS "Members can view channel members" ON public.work_channel_members;
DROP POLICY IF EXISTS "Users can view messages in accessible channels" ON public.work_messages;
DROP POLICY IF EXISTS "Users can insert messages in accessible channels" ON public.work_messages;

CREATE POLICY "Employees can view office channels" ON public.work_channels
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      is_private = false
      AND office_id IN (SELECT office_id FROM public.employees WHERE user_id = auth.uid())
    )
    OR public.is_channel_member(id, auth.uid())
  );

CREATE POLICY "Members can view channel members" ON public.work_channel_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.work_channels c
      WHERE c.id = work_channel_members.channel_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR public.is_channel_member(c.id, auth.uid())
          OR (
            c.is_private = false
            AND c.office_id IN (SELECT office_id FROM public.employees WHERE user_id = auth.uid())
          )
        )
    )
  );

CREATE POLICY "Users can view messages in accessible channels" ON public.work_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.work_channels c
      WHERE c.id = work_messages.channel_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR public.is_channel_member(c.id, auth.uid())
          OR (
            c.is_private = false
            AND c.office_id IN (SELECT office_id FROM public.employees WHERE user_id = auth.uid())
          )
        )
    )
  );

CREATE POLICY "Users can insert messages in accessible channels" ON public.work_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.work_channels c
      WHERE c.id = work_messages.channel_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR public.is_channel_member(c.id, auth.uid())
          OR (
            c.is_private = false
            AND c.office_id IN (SELECT office_id FROM public.employees WHERE user_id = auth.uid())
          )
        )
    )
  );
