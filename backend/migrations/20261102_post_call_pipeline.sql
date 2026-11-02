-- Durable delivery receipts and canonical final transcript reconciliation.
BEGIN;
CREATE TABLE IF NOT EXISTS public.post_call_jobs (
  conversation_id text PRIMARY KEY,
  session_id uuid REFERENCES public.interview_sessions(id),
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  metrics_failed boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.post_call_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.post_call_jobs FROM anon, authenticated;
GRANT ALL ON public.post_call_jobs TO service_role;

-- Serialize canonical replacement with late live messages using the session row lock.
-- Reuse existing turn IDs where text matches, preserving repeated phrases as distinct turns.
CREATE OR REPLACE FUNCTION public.reconcile_final_transcript(p_session_id uuid, p_turns jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE turn jsonb; turn_id uuid; kept uuid[] := ARRAY[]::uuid[];
BEGIN
  PERFORM id FROM interview_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session not found'; END IF;
  FOR turn IN SELECT value FROM jsonb_array_elements(p_turns) LOOP
    SELECT id INTO turn_id FROM transcript_events
      WHERE session_id = p_session_id AND NOT (id = ANY(kept))
        AND speaker = turn->>'speaker' AND text = turn->>'text'
      ORDER BY (sequence_number = (turn->>'sequence_number')::integer) DESC NULLS LAST, created_at
      LIMIT 1;
    IF turn_id IS NULL THEN
      SELECT id INTO turn_id FROM transcript_events
        WHERE session_id = p_session_id AND NOT (id = ANY(kept))
          AND sequence_number = (turn->>'sequence_number')::integer LIMIT 1;
    END IF;
    turn_id := COALESCE(turn_id, (turn->>'id')::uuid);
    INSERT INTO transcript_events (id, session_id, speaker, text, sequence_number, started_at, ended_at)
      VALUES (turn_id, p_session_id, turn->>'speaker', turn->>'text',
        (turn->>'sequence_number')::integer, (turn->>'started_at')::timestamptz, NULL)
      ON CONFLICT (id) DO UPDATE SET speaker = EXCLUDED.speaker, text = EXCLUDED.text,
        sequence_number = EXCLUDED.sequence_number, started_at = EXCLUDED.started_at, ended_at = NULL;
    kept := array_append(kept, turn_id);
  END LOOP;
  DELETE FROM transcript_events WHERE session_id = p_session_id AND NOT (id = ANY(kept));
END;
$$;
REVOKE ALL ON FUNCTION public.reconcile_final_transcript(uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_final_transcript(uuid,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.save_live_transcript(p_session_id uuid, p_turn jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  PERFORM id FROM interview_sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session not found'; END IF;
  -- The final provider transcript supersedes late browser deliveries.
  IF EXISTS (SELECT 1 FROM post_call_jobs WHERE session_id = p_session_id) THEN
    RETURN jsonb_build_object('ignored', true, 'reason', 'Final transcript received');
  END IF;
  INSERT INTO transcript_events (id, session_id, speaker, text, sequence_number, created_at)
    VALUES ((p_turn->>'id')::uuid, p_session_id, p_turn->>'speaker', p_turn->>'text',
      (p_turn->>'sequence_number')::integer, (p_turn->>'created_at')::timestamptz)
    ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text
    RETURNING to_jsonb(transcript_events.*) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.save_live_transcript(uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_live_transcript(uuid,jsonb) TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';
