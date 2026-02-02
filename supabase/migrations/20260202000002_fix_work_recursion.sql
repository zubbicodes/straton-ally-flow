CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.work_channel_members
        WHERE channel_id = _channel_id AND user_id = _user_id
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_channel_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Employees can view office channels" ON public.work_channels;
DROP POLICY IF EXISTS "Members can view channel members" ON public.work_channel_members;
DROP POLICY IF EXISTS "Users can view messages in accessible channels" ON public.work_messages;
DROP POLICY IF EXISTS "Users can insert messages in accessible channels" ON public.work_messages;

CREATE POLICY "Employees can view office channels" ON public.work_channels
    FOR SELECT USING (
        (office_id IN (
            SELECT office_id FROM public.employees WHERE user_id = auth.uid()
        ))
        OR
        public.is_channel_member(id, auth.uid())
    );

CREATE POLICY "Members can view channel members" ON public.work_channel_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.work_channels c
            WHERE c.id = work_channel_members.channel_id
            AND (
                public.has_role(auth.uid(), 'admin')
                OR
                c.office_id IN (SELECT office_id FROM public.employees WHERE user_id = auth.uid())
                OR
                public.is_channel_member(c.id, auth.uid())
            )
        )
    );

CREATE POLICY "Users can view messages in accessible channels" ON public.work_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.work_channels c
            WHERE c.id = work_messages.channel_id
            AND (
                public.has_role(auth.uid(), 'admin')
                OR
                c.office_id IN (SELECT office_id FROM public.employees WHERE user_id = auth.uid())
                OR
                public.is_channel_member(c.id, auth.uid())
            )
        )
    );

CREATE POLICY "Users can insert messages in accessible channels" ON public.work_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.work_channels c
            WHERE c.id = work_messages.channel_id
            AND (
                public.has_role(auth.uid(), 'admin')
                OR
                c.office_id IN (SELECT office_id FROM public.employees WHERE user_id = auth.uid())
                OR
                public.is_channel_member(c.id, auth.uid())
            )
        )
    );
