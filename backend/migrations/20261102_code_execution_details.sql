-- Run evidence on code_executions: the exact code/language run, per-case results and counts.
--
-- RECONSTRUCTED on 2026-11-13: the original uncommitted file was lost. Rebuilt from
-- docs/run-recording.md and the live schema, where these columns already exist (the
-- original was applied to the shared Supabase project on/after 2026-11-02). Every
-- statement is idempotent, so it is safe for fresh environments and a no-op for
-- existing columns. The original index name is unknown: in a database that already
-- has a (session_id, created_at) index, skip the CREATE INDEX to avoid a duplicate.
BEGIN;
ALTER TABLE public.code_executions
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS test_results jsonb,
  ADD COLUMN IF NOT EXISTS passed_count integer,
  ADD COLUMN IF NOT EXISTS total_count integer;

-- Feedback reads a session's recent Runs newest-first.
CREATE INDEX IF NOT EXISTS code_executions_session_created_at_idx
  ON public.code_executions (session_id, created_at DESC);
COMMIT;
