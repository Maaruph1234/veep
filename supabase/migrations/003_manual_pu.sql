-- Lets a sponsor add a polling unit that is missing from the list. Safe to re-run.
alter table polling_units add column if not exists is_manual boolean not null default false;
alter table polling_units add column if not exists added_by uuid references sponsors(id) on delete set null;

create or replace function add_polling_unit(p_ward_id uuid, p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare sid uuid := my_sponsor_id(); nm text := regexp_replace(btrim(coalesce(p_name,'')), '\s+', ' ', 'g');
        existing uuid; lga text; ward text; n int; code text;
begin
  if sid is null then raise exception 'Not an active sponsor'; end if;
  if length(nm) < 2 or length(nm) > 150 then raise exception 'Enter the polling unit name'; end if;
  if not exists (select 1 from wards where id = p_ward_id) then raise exception 'Choose a ward first'; end if;
  select id into existing from polling_units where ward_id = p_ward_id and lower(name) = lower(nm) limit 1;
  if existing is not null then return existing; end if;
  if (select count(*) from polling_units where added_by = sid) >= 50 then
    raise exception 'You have added the maximum number of new polling units. Contact the Directorate.'; end if;
  select split_part(delimitation_code,'-',2), split_part(delimitation_code,'-',3) into lga, ward
    from polling_units where ward_id = p_ward_id and delimitation_code like '22-%-%-%' limit 1;
  lga := coalesce(lga,'00'); ward := coalesce(ward,'00');
  select count(*) + 1 into n from polling_units where ward_id = p_ward_id and is_manual;
  loop
    code := '22-' || lga || '-' || ward || '-M' || lpad(n::text, 3, '0');
    exit when not exists (select 1 from polling_units where delimitation_code = code);
    n := n + 1;
  end loop;
  insert into polling_units (ward_id, name, delimitation_code, is_manual, added_by)
    values (p_ward_id, nm, code, true, sid) returning id into existing;
  insert into audit_logs (actor_id, actor_role, action, target_type, target_id, details)
    values (auth.uid(), 'sponsor', 'add_polling_unit', 'polling_units', existing::text, jsonb_build_object('sponsor_id', sid));
  return existing;
end $$;
revoke execute on function add_polling_unit(uuid, text) from public, anon;
grant execute on function add_polling_unit(uuid, text) to authenticated;
