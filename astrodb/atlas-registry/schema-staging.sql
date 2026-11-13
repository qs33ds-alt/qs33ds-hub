-- AstroDB / ATLAS registry v0.1 (STAGING ONLY; not applied)
-- Existing astrodb_charts, astrodb_documents, astrodb_studies remain untouched.
create table if not exists public.astrodb_atlas_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chart_id uuid references public.astrodb_charts(id) on delete set null,
  person_local_id text,
  person_label text not null,
  engine text not null check (engine in ('ORIGEN','ENNOIA','REVOLUCION_SOLAR','SINTESIS')),
  engine_version text,
  execution_id text,
  cycle_label text,
  input_sha256 text check (input_sha256 is null or input_sha256 ~ '^[0-9a-fA-F]{64}$'),
  status text not null default 'imported_unverified'
    check (status in ('imported_unverified','pending','validated','failed','cancelled')),
  source text not null default 'manual' check (source in ('manual','verified_import','instrumented')),
  evidence_uri text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, engine, execution_id)
);
create index if not exists astrodb_atlas_exec_person_idx
  on public.astrodb_atlas_executions(user_id, person_local_id, created_at desc);
create table if not exists public.astrodb_atlas_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  execution_ref uuid not null references public.astrodb_atlas_executions(id) on delete cascade,
  artifact_type text not null check (artifact_type in ('natalcore','json','docx','pdf','zip','other')),
  filename text not null,
  storage_ref text,
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-fA-F]{64}$'),
  created_at timestamptz not null default now()
);
create table if not exists public.astrodb_atlas_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  execution_ref uuid not null references public.astrodb_atlas_executions(id) on delete cascade,
  artifact_ref uuid references public.astrodb_atlas_artifacts(id) on delete set null,
  event_type text not null check (event_type in ('generated','saved','download_requested','download_confirmed','imported')),
  evidence_level text not null check (evidence_level in ('verified','client_reported','historical_unverified')),
  occurred_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);
create index if not exists astrodb_atlas_events_timeline_idx
  on public.astrodb_atlas_events(user_id, occurred_at desc);
alter table public.astrodb_atlas_executions enable row level security;
alter table public.astrodb_atlas_artifacts enable row level security;
alter table public.astrodb_atlas_events enable row level security;
create policy atlas_exec_owner on public.astrodb_atlas_executions
  for all to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy atlas_artifact_owner on public.astrodb_atlas_artifacts
  for all to authenticated using (
    user_id = (select auth.uid()) and exists (
      select 1 from public.astrodb_atlas_executions e
      where e.id = execution_ref and e.user_id = (select auth.uid())
    )
  ) with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.astrodb_atlas_executions e
      where e.id = execution_ref and e.user_id = (select auth.uid())
    )
  );
create policy atlas_event_owner on public.astrodb_atlas_events
  for select to authenticated using (user_id = (select auth.uid()));
create policy atlas_event_insert_owner on public.astrodb_atlas_events
  for insert to authenticated with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.astrodb_atlas_executions e
      where e.id = execution_ref and e.user_id = (select auth.uid())
    )
  );
-- A download_requested event is not proof of a completed download.
-- Verified events must be produced by a trusted backend, not by browser claims.
