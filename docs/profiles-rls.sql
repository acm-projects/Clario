-- Run the audit first in the Supabase SQL Editor. These statements do not change data.
SELECT c.relrowsecurity AS rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'profiles';

SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';

-- Verify authenticated users have SELECT and UPDATE policies using auth.uid() = id.
-- UPDATE needs both USING (for the existing row) and WITH CHECK (for the resulting row).
-- Permissive policies are ORed: review any broad existing policies as well.
-- The following is optional fallback SQL, not automatically applied by the app.
-- It enables RLS, creates no tables/columns, and preserves existing signup INSERT policies.
-- Restrictive policies ensure broad existing authenticated policies cannot expose other users' rows.
BEGIN;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'clario_profiles_select_own') THEN
    CREATE POLICY clario_profiles_select_own ON public.profiles
      FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'clario_profiles_update_own') THEN
    CREATE POLICY clario_profiles_update_own ON public.profiles
      FOR UPDATE TO authenticated
      USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'clario_profiles_select_owner_limit') THEN
    CREATE POLICY clario_profiles_select_owner_limit ON public.profiles AS RESTRICTIVE
      FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'clario_profiles_update_owner_limit') THEN
    CREATE POLICY clario_profiles_update_owner_limit ON public.profiles AS RESTRICTIVE
      FOR UPDATE TO authenticated
      USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
  END IF;
END $$;
COMMIT;

-- Re-run the audit after applying. Existing anonymous/public policies also need review.
-- Do not create a new profile row here. The existing signup trigger/setup must create it.
