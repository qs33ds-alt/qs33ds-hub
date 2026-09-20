-- ============================================================
-- QS33DS · AstroDB
-- Almacenamiento privado de cartas + NatalCore
-- ============================================================

create extension if not exists pgcrypto;

-- 1. CARTAS
create table if not exists public.astrodb_charts (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    name text not null,

    birth_date date,
    birth_time time,
    birth_place text,
    latitude double precision,
    longitude double precision,
    timezone text,

    -- Entrada utilizada para realizar el cálculo
    input_data jsonb not null default '{}'::jsonb,

    -- Resultado completo de AstroDB
    chart_data jsonb not null default '{}'::jsonb,

    -- NatalCore estructurado generado por el motor
    natalcore jsonb not null default '{}'::jsonb,

    astrodb_version text,
    natalcore_version text,

    notes text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists astrodb_charts_user_idx
on public.astrodb_charts(user_id);

create index if not exists astrodb_charts_name_idx
on public.astrodb_charts(name);


-- 2. DOCUMENTOS GENERADOS
create table if not exists public.astrodb_documents (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    chart_id uuid not null
        references public.astrodb_charts(id)
        on delete cascade,

    document_type text not null,
    version text,

    storage_path text not null,
    mime_type text,

    created_at timestamptz not null default now()
);

create index if not exists astrodb_documents_chart_idx
on public.astrodb_documents(chart_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.astrodb_charts enable row level security;
alter table public.astrodb_documents enable row level security;


-- CARTAS: únicamente su propietario

create policy "astrodb_charts_select_own"
on public.astrodb_charts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "astrodb_charts_insert_own"
on public.astrodb_charts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "astrodb_charts_update_own"
on public.astrodb_charts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "astrodb_charts_delete_own"
on public.astrodb_charts
for delete
to authenticated
using ((select auth.uid()) = user_id);


-- DOCUMENTOS: únicamente su propietario

create policy "astrodb_documents_select_own"
on public.astrodb_documents
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "astrodb_documents_insert_own"
on public.astrodb_documents
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "astrodb_documents_update_own"
on public.astrodb_documents
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "astrodb_documents_delete_own"
on public.astrodb_documents
for delete
to authenticated
using ((select auth.uid()) = user_id);


-- ============================================================
-- STORAGE PRIVADO
-- ============================================================

insert into storage.buckets (id, name, public)
values ('astrodb-private', 'astrodb-private', false)
on conflict (id) do update
set public = false;


-- Cada usuario solo puede acceder a:
-- astrodb-private/<su UUID>/...

create policy "astrodb_storage_select_own"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'astrodb-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "astrodb_storage_insert_own"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'astrodb-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "astrodb_storage_update_own"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'astrodb-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
    bucket_id = 'astrodb-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "astrodb_storage_delete_own"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'astrodb-private'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

