-- Sponsor positions, voter targets and first-login onboarding.
-- Run once in the Supabase SQL Editor. Safe to re-run.

create table if not exists sponsor_categories (
  id int primary key,
  name text unique not null,
  quota int not null check (quota > 0),   -- voters each person in this position must record
  seats int not null default 1,           -- how many people hold this position (info only)
  sort int not null
);

insert into sponsor_categories (id, name, quota, seats, sort) values
 (1,  'H.E Governor',                 100, 1,    1),
 (2,  'H.E Deputy Governor',           50, 1,    2),
 (3,  'Speaker',                       50, 1,    3),
 (4,  'Senator',                       50, 3,    4),
 (5,  'Hon. Reps Member',              30, 8,    5),
 (6,  'Hon. State Assembly Member',    20, 23,   6),
 (7,  'Hon. Commissioner',             20, 25,   7),
 (8,  'SSG',                           30, 1,    8),
 (9,  'HOS',                           30, 1,    9),
 (10, 'Hon. LGA Chairman',             20, 21,  10),
 (11, 'Special Adviser',               10, 175, 11),
 (12, 'SS Assistant',                   5, 460, 12),
 (13, 'S Assistant',                    2, 3200,13),
 (14, 'Hon. Councillor',                5, 225, 14),
 (15, 'APC State EXCO',                 5, 37,  15),
 (16, 'APC LG EXCO',                    2, 36,  16),
 (17, 'APC LG Chairman',                5, 21,  17),
 (18, 'Boards of Parastatals',          5, 220, 18),
 (19, 'Federal Appointee',             10, 30,  19)
on conflict (id) do update set name = excluded.name, quota = excluded.quota, seats = excluded.seats, sort = excluded.sort;

alter table sponsors add column if not exists category_id int references sponsor_categories(id);
alter table sponsors add column if not exists onboarded_at timestamptz;

alter table sponsor_categories enable row level security;
drop policy if exists cat_read on sponsor_categories;
create policy cat_read on sponsor_categories for select to authenticated using (true);
drop policy if exists cat_admin on sponsor_categories;
create policy cat_admin on sponsor_categories for all to authenticated using (is_admin()) with check (is_admin());
grant select on sponsor_categories to authenticated;
grant insert, update, delete on sponsor_categories to authenticated;
grant all on sponsor_categories to service_role;

-- First login: the sponsor picks a position and enters their name, once.
create or replace function complete_onboarding(p_name text, p_category int) returns void
language plpgsql security definer set search_path = public as $$
declare sid uuid; uid uuid := auth.uid(); nm text := btrim(coalesce(p_name, ''));
begin
  sid := my_sponsor_id();
  if sid is null then raise exception 'Not an active sponsor'; end if;
  if length(nm) < 2 or length(nm) > 120 then raise exception 'Enter your full name'; end if;
  if not exists (select 1 from sponsor_categories where id = p_category) then raise exception 'Choose a position'; end if;
  if exists (select 1 from sponsors where id = sid and onboarded_at is not null) then raise exception 'Profile already completed'; end if;
  update sponsors set sponsor_name = nm, category_id = p_category, onboarded_at = now() where id = sid;
  update profiles set full_name = nm where id = uid;
  insert into audit_logs (actor_id, actor_role, action, target_type, target_id, details)
  values (uid, 'sponsor', 'onboarding', 'sponsor', sid::text, jsonb_build_object('sponsor_id', sid, 'category_id', p_category));
end $$;
revoke execute on function complete_onboarding(text, int) from public, anon;
grant execute on function complete_onboarding(text, int) to authenticated;

-- A sponsor cannot record more voters than their position's target.
create or replace function quota_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare q int; n bigint;
begin
  select c.quota into q from sponsors s join sponsor_categories c on c.id = s.category_id where s.id = new.sponsor_id;
  if q is null then raise exception 'Complete your profile (choose your position) before adding records'; end if;
  perform 1 from sponsors where id = new.sponsor_id for update;
  select count(*) into n from supporter_records where sponsor_id = new.sponsor_id;
  if n >= q then raise exception 'You have reached your target of % voters', q; end if;
  return new;
end $$;
drop trigger if exists trg_zz_quota on supporter_records;
create trigger trg_zz_quota before insert on supporter_records for each row execute function quota_guard();

-- Admin overview now includes position and target.
drop function if exists sponsor_overview();
create or replace function sponsor_overview()
returns table (id uuid, sponsor_name text, status text, record_count bigint, token_active boolean, created_at timestamptz, category text, quota int)
language sql stable security definer set search_path = public as $$
  select s.id, s.sponsor_name, s.status,
    (select count(*) from supporter_records r where r.sponsor_id = s.id),
    exists (select 1 from access_tokens t where t.sponsor_id = s.id and t.revoked_at is null and (t.expires_at is null or t.expires_at > now())),
    s.created_at, c.name, c.quota
  from sponsors s left join sponsor_categories c on c.id = s.category_id
  where is_admin() order by s.created_at desc $$;
revoke execute on function sponsor_overview() from public, anon;
grant execute on function sponsor_overview() to authenticated;
