-- VEEP 2027 schema. Run in Supabase SQL editor (or supabase db push).
create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin','sponsor')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);
create table sponsors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users on delete cascade,
  sponsor_name text not null check (length(btrim(sponsor_name)) between 2 and 120),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);
create table access_tokens (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references sponsors on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create table local_governments (id uuid primary key default gen_random_uuid(), name text unique not null);
create table wards (
  id uuid primary key default gen_random_uuid(),
  lga_id uuid not null references local_governments on delete restrict,
  name text not null, unique (lga_id, name)
);
create table polling_units (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references wards on delete restrict,
  name text not null,
  delimitation_code text unique not null,
  unique (ward_id, name)
);
create table supporter_records (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references sponsors on delete cascade,
  full_name text not null check (length(btrim(full_name)) between 2 and 150),
  lga_id uuid not null references local_governments,
  ward_id uuid not null references wards,
  polling_unit_id uuid not null references polling_units,
  delimitation_code text not null,
  gender text not null check (gender in ('Male','Female','Prefer not to say')),
  disability_status text not null check (disability_status in ('Person with Disability','Non-disabled','Prefer not to say')),
  date_of_birth date not null,
  consent_recorded boolean not null check (consent_recorded),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid, actor_role text, action text not null,
  target_type text, target_id text, details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on wards (lga_id);
create index on polling_units (ward_id);
create index on supporter_records (sponsor_id, created_at desc);
create index on supporter_records (sponsor_id, lga_id, ward_id, polling_unit_id);
create index on supporter_records (sponsor_id, lower(full_name));
create index on access_tokens (sponsor_id);
create index on audit_logs (created_at desc);

-- Helper functions -------------------------------------------------------
create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and status = 'active') $$;

-- The caller's sponsor id, only while sponsor, profile AND a token are all active.
-- Revoking a token therefore cuts data access immediately, even for open sessions.
create or replace function my_sponsor_id() returns uuid language sql stable security definer set search_path = public as $$
  select s.id from sponsors s join profiles p on p.id = s.user_id
  where s.user_id = auth.uid() and s.status = 'active' and p.status = 'active'
    and exists (select 1 from access_tokens t where t.sponsor_id = s.id and t.revoked_at is null
                and (t.expires_at is null or t.expires_at > now())) $$;

-- Row triggers -----------------------------------------------------------
create or replace function records_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare pu record; sid uuid;
begin
  if tg_op = 'INSERT' then
    sid := my_sponsor_id();
    if sid is null then raise exception 'Not an active sponsor'; end if;
    new.sponsor_id := sid;                 -- client value is always ignored
  else
    new.sponsor_id := old.sponsor_id;      -- ownership can never be changed
    new.created_at := old.created_at;
  end if;
  select p.ward_id, p.delimitation_code, w.lga_id into pu
    from polling_units p join wards w on w.id = p.ward_id where p.id = new.polling_unit_id;
  if not found or pu.ward_id <> new.ward_id or pu.lga_id <> new.lga_id then
    raise exception 'Invalid LGA, ward and polling unit combination'; end if;
  new.delimitation_code := pu.delimitation_code;
  if new.date_of_birth > current_date - interval '18 years' or new.date_of_birth < date '1900-01-01' then
    raise exception 'Date of birth must show the person is 18 or older'; end if;
  new.full_name := btrim(new.full_name);
  new.updated_at := now();
  return new;
end $$;
create trigger trg_records_guard before insert or update on supporter_records
  for each row execute function records_guard();

-- Audit trail. Stores ids only, never names or other personal data.
create or replace function audit_row() returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  insert into audit_logs (actor_id, actor_role, action, target_type, target_id, details)
  values (auth.uid(), (select role from profiles where id = auth.uid()), lower(tg_op), tg_table_name, r.id::text,
          jsonb_build_object('sponsor_id', r.sponsor_id));
  return null;
end $$;
create trigger trg_records_audit after insert or update or delete on supporter_records
  for each row execute function audit_row();

-- RPCs --------------------------------------------------------------------
create or replace function scope_stats() returns json language sql stable security invoker set search_path = public as $$
  select json_build_object('total', count(*),
    'male', count(*) filter (where gender = 'Male'),
    'female', count(*) filter (where gender = 'Female'),
    'pwd', count(*) filter (where disability_status = 'Person with Disability'),
    'non_pwd', count(*) filter (where disability_status = 'Non-disabled')) from supporter_records $$;

create or replace function sponsor_overview()
returns table (id uuid, sponsor_name text, status text, record_count bigint, token_active boolean, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.sponsor_name, s.status,
    (select count(*) from supporter_records r where r.sponsor_id = s.id),
    exists (select 1 from access_tokens t where t.sponsor_id = s.id and t.revoked_at is null and (t.expires_at is null or t.expires_at > now())),
    s.created_at
  from sponsors s where is_admin() order by s.created_at desc $$;

create or replace function log_event(p_action text, p_details jsonb default '{}') returns void
language sql security definer set search_path = public as $$
  insert into audit_logs (actor_id, actor_role, action, target_type, details)
  select auth.uid(), role, left(p_action, 50), 'client', p_details from profiles where id = auth.uid() $$;

-- Row Level Security -------------------------------------------------------
alter table profiles enable row level security;
alter table sponsors enable row level security;
alter table access_tokens enable row level security;
alter table local_governments enable row level security;
alter table wards enable row level security;
alter table polling_units enable row level security;
alter table supporter_records enable row level security;
alter table audit_logs enable row level security;

revoke all on all tables in schema public from anon;
revoke all on access_tokens from authenticated;          -- service role only
revoke insert, update, delete on audit_logs from authenticated;
revoke execute on all functions in schema public from public, anon;
grant execute on function is_admin(), my_sponsor_id(), scope_stats(), sponsor_overview(), log_event(text, jsonb) to authenticated;

create policy profiles_self on profiles for select to authenticated using (id = auth.uid() or is_admin());
create policy sponsors_self on sponsors for select to authenticated using (user_id = auth.uid() or is_admin());

create policy ref_read_lga on local_governments for select to authenticated using (true);
create policy ref_read_ward on wards for select to authenticated using (true);
create policy ref_read_pu on polling_units for select to authenticated using (true);
create policy ref_admin_lga on local_governments for all to authenticated using (is_admin()) with check (is_admin());
create policy ref_admin_ward on wards for all to authenticated using (is_admin()) with check (is_admin());
create policy ref_admin_pu on polling_units for all to authenticated using (is_admin()) with check (is_admin());

-- Sponsors: full control of their own rows only. Everyone else's rows do not exist for them.
create policy rec_sponsor_all on supporter_records for all to authenticated
  using (sponsor_id = my_sponsor_id()) with check (sponsor_id = my_sponsor_id());
create policy rec_admin_select on supporter_records for select to authenticated using (is_admin());
create policy rec_admin_update on supporter_records for update to authenticated using (is_admin()) with check (is_admin());
create policy rec_admin_delete on supporter_records for delete to authenticated using (is_admin());

create policy audit_admin_read on audit_logs for select to authenticated using (is_admin());
-- access_tokens: RLS on, no policies = unreachable except via service role on the server.
