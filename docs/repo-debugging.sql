-- Additive MVP storage; existing interview tables and analytics are unchanged.
create table if not exists public.repo_debug_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id text not null,
  mode text not null default 'repo_debugging' check (mode = 'repo_debugging'),
  status text not null default 'submitted' check (status = 'submitted'),
  files jsonb not null,
  evaluation jsonb not null,
  submitted_at timestamptz not null default now()
);
create index if not exists repo_debug_submissions_user_time on public.repo_debug_submissions(user_id, submitted_at desc);
alter table public.repo_debug_submissions enable row level security;
drop policy if exists "Read own repository submissions" on public.repo_debug_submissions;
create policy "Read own repository submissions" on public.repo_debug_submissions for select to authenticated using ((select auth.uid()) = user_id);
-- Writes go through the authenticated backend using its existing service-role client.
revoke all on public.repo_debug_submissions from anon, authenticated;
grant select on public.repo_debug_submissions to authenticated;
grant all on public.repo_debug_submissions to service_role;
