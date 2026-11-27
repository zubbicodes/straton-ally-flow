-- Queue text messages on the server so delivery does not depend on an open tab.
CREATE TABLE public.scheduled_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 8000),
  mentions uuid[] NOT NULL DEFAULT '{}',
  send_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scheduled_chat_due_idx ON public.scheduled_chat_messages (send_at)
  WHERE status = 'pending';
CREATE INDEX scheduled_chat_user_idx ON public.scheduled_chat_messages (user_id, created_at DESC);

ALTER TABLE public.scheduled_chat_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.scheduled_chat_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.scheduled_chat_messages TO authenticated;

CREATE POLICY scheduled_chat_select ON public.scheduled_chat_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY scheduled_chat_insert ON public.scheduled_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND sent_message_id IS NULL
    AND last_error IS NULL
    AND send_at > now()
    AND public.can_post_in_channel(channel_id)
    AND (parent_id IS NULL OR EXISTS (
      SELECT 1 FROM public.messages p
      WHERE p.id = scheduled_chat_messages.parent_id
        AND p.channel_id = scheduled_chat_messages.channel_id AND p.parent_id IS NULL
    ))
  );

CREATE POLICY scheduled_chat_delete ON public.scheduled_chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status IN ('pending', 'failed'));

CREATE OR REPLACE FUNCTION public.publish_scheduled_chat_messages()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  job public.scheduled_chat_messages%ROWTYPE;
  new_message_id uuid;
  published integer := 0;
BEGIN
  FOR job IN
    SELECT * FROM public.scheduled_chat_messages
    WHERE status = 'pending' AND send_at <= now()
    ORDER BY send_at, created_at LIMIT 100
    FOR UPDATE SKIP LOCKED
  LOOP
    IF NOT public.can_post_in_channel(job.channel_id, job.user_id) THEN
      UPDATE public.scheduled_chat_messages
      SET status = 'failed', last_error = 'You can no longer post in this conversation'
      WHERE id = job.id;
      CONTINUE;
    END IF;

    BEGIN
      INSERT INTO public.messages (channel_id, user_id, parent_id, body, mentions)
      VALUES (job.channel_id, job.user_id, job.parent_id, job.body, job.mentions)
      RETURNING id INTO new_message_id;

      UPDATE public.scheduled_chat_messages
      SET status = 'sent', sent_message_id = new_message_id, last_error = NULL
      WHERE id = job.id;
      published := published + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.scheduled_chat_messages
      SET status = 'failed', last_error = left(SQLERRM, 500)
      WHERE id = job.id;
    END;
  END LOOP;
  RETURN published;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_scheduled_chat_messages() FROM PUBLIC, anon, authenticated;

-- Existing deployments already use pg_cron for attendance and notifications.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publish-scheduled-chat-messages') THEN
    PERFORM cron.schedule(
      'publish-scheduled-chat-messages',
      '* * * * *',
      'select public.publish_scheduled_chat_messages();'
    );
  END IF;
END $$;
