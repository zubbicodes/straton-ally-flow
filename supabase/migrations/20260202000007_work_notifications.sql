ALTER TABLE public.work_messages
ADD COLUMN IF NOT EXISTS mentions uuid[] NOT NULL DEFAULT '{}'::uuid[];

CREATE TABLE IF NOT EXISTS public.work_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  office_id uuid REFERENCES public.offices(id) ON DELETE SET NULL,
  channel_id uuid REFERENCES public.work_channels(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.work_messages(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('mention', 'message')),
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_notifications_user_created_at_idx
  ON public.work_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS work_notifications_user_is_read_idx
  ON public.work_notifications (user_id, is_read);

ALTER TABLE public.work_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage work notifications" ON public.work_notifications;
DROP POLICY IF EXISTS "Users can view own work notifications" ON public.work_notifications;
DROP POLICY IF EXISTS "Users can update own work notifications" ON public.work_notifications;
DROP POLICY IF EXISTS "Users can delete own work notifications" ON public.work_notifications;

CREATE POLICY "Admins can manage work notifications" ON public.work_notifications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own work notifications" ON public.work_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own work notifications" ON public.work_notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own work notifications" ON public.work_notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_work_message_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _channel record;
  _recipient uuid;
  _mentioned uuid[];
  _preview text;
BEGIN
  SELECT id, office_id, is_private, name
  INTO _channel
  FROM public.work_channels
  WHERE id = NEW.channel_id;

  IF _channel.id IS NULL THEN
    RETURN NEW;
  END IF;

  _mentioned := COALESCE(NEW.mentions, '{}'::uuid[]);
  _preview := CASE
    WHEN NEW.content IS NULL THEN NULL
    ELSE left(NEW.content, 240)
  END;

  FOREACH _recipient IN ARRAY _mentioned LOOP
    IF _recipient IS NULL OR _recipient = NEW.user_id THEN
      CONTINUE;
    END IF;

    INSERT INTO public.work_notifications (
      user_id,
      actor_id,
      office_id,
      channel_id,
      message_id,
      type,
      title,
      body
    )
    VALUES (
      _recipient,
      NEW.user_id,
      _channel.office_id,
      NEW.channel_id,
      NEW.id,
      'mention',
      'You were mentioned',
      _preview
    );
  END LOOP;

  IF _channel.is_private THEN
    FOR _recipient IN
      SELECT m.user_id
      FROM public.work_channel_members m
      WHERE m.channel_id = NEW.channel_id
    LOOP
      IF _recipient = NEW.user_id OR _recipient = ANY(_mentioned) THEN
        CONTINUE;
      END IF;

      INSERT INTO public.work_notifications (
        user_id,
        actor_id,
        office_id,
        channel_id,
        message_id,
        type,
        title,
        body
      )
      VALUES (
        _recipient,
        NEW.user_id,
        _channel.office_id,
        NEW.channel_id,
        NEW.id,
        'message',
        'New message',
        _preview
      );
    END LOOP;
  ELSE
    FOR _recipient IN
      SELECT DISTINCT e.user_id
      FROM public.employees e
      WHERE e.office_id = _channel.office_id
    LOOP
      IF _recipient = NEW.user_id OR _recipient = ANY(_mentioned) THEN
        CONTINUE;
      END IF;

      INSERT INTO public.work_notifications (
        user_id,
        actor_id,
        office_id,
        channel_id,
        message_id,
        type,
        title,
        body
      )
      VALUES (
        _recipient,
        NEW.user_id,
        _channel.office_id,
        NEW.channel_id,
        NEW.id,
        'message',
        'New message',
        _preview
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_work_message_created_notifications ON public.work_messages;

CREATE TRIGGER on_work_message_created_notifications
AFTER INSERT ON public.work_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_work_message_notifications();

ALTER PUBLICATION supabase_realtime ADD TABLE public.work_notifications;

