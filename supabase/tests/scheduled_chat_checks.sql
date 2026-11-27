-- Run against a disposable database with the chat migrations applied:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/scheduled_chat_checks.sql
-- This transaction is rolled back after checking RLS and server delivery.
BEGIN;

CREATE TEMP TABLE scheduled_test_ids (user_id uuid, other_user_id uuid, channel_id uuid, scheduled_id uuid) ON COMMIT DROP;
GRANT ALL ON scheduled_test_ids TO authenticated;
CREATE TEMP TABLE scheduled_test_results (name text, ok boolean) ON COMMIT DROP;
GRANT ALL ON scheduled_test_results TO authenticated;

INSERT INTO scheduled_test_ids (user_id, other_user_id, channel_id)
SELECT cm.user_id,
       (SELECT u.id FROM auth.users u WHERE u.id <> cm.user_id ORDER BY u.id LIMIT 1),
       cm.channel_id
FROM public.channel_members cm
JOIN public.channels c ON c.id = cm.channel_id
WHERE c.posting_policy = 'everyone' AND c.archived_at IS NULL
ORDER BY cm.joined_at LIMIT 1;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM scheduled_test_ids WHERE other_user_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Fixture needs a writable channel and two users';
  END IF;
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT user_id FROM scheduled_test_ids), 'role', 'authenticated')::text, true);

WITH queued AS (
  INSERT INTO public.scheduled_chat_messages (channel_id, user_id, body, send_at)
  SELECT channel_id, user_id, 'scheduled chat test', now() + interval '5 minutes' FROM scheduled_test_ids
  RETURNING id
)
UPDATE scheduled_test_ids SET scheduled_id = (SELECT id FROM queued);

INSERT INTO scheduled_test_results SELECT 'author sees scheduled message', EXISTS (
  SELECT 1 FROM public.scheduled_chat_messages WHERE id = (SELECT scheduled_id FROM scheduled_test_ids)
);

SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT other_user_id FROM scheduled_test_ids), 'role', 'authenticated')::text, true);
INSERT INTO scheduled_test_results SELECT 'other user cannot read scheduled message', NOT EXISTS (
  SELECT 1 FROM public.scheduled_chat_messages WHERE id = (SELECT scheduled_id FROM scheduled_test_ids)
);
WITH deleted AS (DELETE FROM public.scheduled_chat_messages WHERE id = (SELECT scheduled_id FROM scheduled_test_ids) RETURNING id)
INSERT INTO scheduled_test_results SELECT 'other user cannot cancel scheduled message', count(*) = 0 FROM deleted;
RESET ROLE;

-- Move the queued row into the past as the database owner, then let the worker publish it.
UPDATE public.scheduled_chat_messages SET send_at = now() - interval '1 minute'
WHERE id = (SELECT scheduled_id FROM scheduled_test_ids);
SELECT public.publish_scheduled_chat_messages();

INSERT INTO scheduled_test_results SELECT 'scheduled message published once',
  s.status = 'sent' AND s.sent_message_id IS NOT NULL
    AND (SELECT count(*) FROM public.messages m WHERE m.id = s.sent_message_id AND m.body = 'scheduled chat test') = 1
FROM public.scheduled_chat_messages s WHERE s.id = (SELECT scheduled_id FROM scheduled_test_ids);

INSERT INTO scheduled_test_results SELECT 'cron job installed', EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'publish-scheduled-chat-messages'
);
INSERT INTO scheduled_test_results SELECT 'clients cannot edit scheduled rows',
  NOT has_table_privilege('authenticated', 'public.scheduled_chat_messages', 'UPDATE');
INSERT INTO scheduled_test_results SELECT 'clients cannot invoke scheduler',
  NOT has_function_privilege('authenticated', 'public.publish_scheduled_chat_messages()', 'EXECUTE');

SELECT CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS result, name FROM scheduled_test_results;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM scheduled_test_results WHERE NOT ok) THEN
    RAISE EXCEPTION 'Scheduled chat checks failed';
  END IF;
END $$;
ROLLBACK;
