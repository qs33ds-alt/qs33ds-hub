do $$
begin
  if exists (select 1 from public.astrodb_charts where nullif(coalesce(input_data->>'id',input_data->>'astrodb_local_id'),'') is null) then
    raise exception 'Hay fichas sin identificador; no se modifica el esquema.';
  end if;
  if exists (select 1 from public.astrodb_charts where input_data ? 'id' and input_data ? 'astrodb_local_id' and input_data->>'id' <> input_data->>'astrodb_local_id') then
    raise exception 'Hay identificadores históricos ambiguos; no se modifica el esquema.';
  end if;
  if exists (select 1 from public.astrodb_charts group by user_id, nullif(coalesce(input_data->>'id',input_data->>'astrodb_local_id'),'') having count(*) > 1) then
    raise exception 'Hay fichas duplicadas; no se elimina ni combina ninguna.';
  end if;
end $$;
alter table public.astrodb_charts add column chart_local_id text generated always as (nullif(coalesce(input_data->>'id',input_data->>'astrodb_local_id'),'')) stored;
alter table public.astrodb_charts add constraint astrodb_charts_user_chart_unique unique (user_id,chart_local_id);
alter table public.astrodb_charts add constraint astrodb_charts_local_id_present check (chart_local_id is not null);
