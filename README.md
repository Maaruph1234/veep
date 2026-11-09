# VEEP 2027 (Kebbi State supporter data app)
Powered by Directorate for Election Planning & Monitoring (EPM) Kebbi State.

## How it works
**Auth.** Admin logs in with email and password (Supabase Auth). Each sponsor has a hidden Supabase Auth user whose password is their token. The login route hashes the token (SHA-256), checks it is active, then signs in, so every sponsor query runs as a real Supabase user. Tokens are 256-bit random values, only the hash is stored, and the plain token is shown to the admin once.

**Isolation.** All rules live in Postgres (`supabase/migrations/001_schema.sql`):
- `supporter_records` policy: `sponsor_id = my_sponsor_id()`. Another sponsor's rows are invisible, so edits, deletes, exports and URL or ID guessing return nothing.
- A trigger forces `sponsor_id` on insert and blocks changing it later.
- `my_sponsor_id()` returns null once the sponsor is deactivated or the token is revoked or expired, so open sessions lose access immediately.
- `access_tokens` has no policies and no grants: service role only.
- Admin access is a separate policy (`is_admin()`), and actions are written to `audit_logs` (ids only, no personal data).
- The service-role key is used only in server routes (`lib/supabase/admin.ts`).

## Setup
1. Create a Supabase project. In SQL Editor run `supabase/migrations/001_schema.sql`.
2. Authentication > Settings: turn OFF "Allow new users to sign up".
3. Create the admin: Authentication > Users > Add user (email + strong password), then run:
   `insert into profiles (id, full_name, role) values ('<that user id>', 'Super Admin', 'admin');`
   Turn on MFA for this account.
4. Import electoral data (use real INEC/EPM files). Load a CSV (lga, ward, polling_unit, code) into a staging table, then:
```sql
create table import_staging (lga text, ward text, pu text, code text);
-- Table Editor > import CSV into import_staging, then:
insert into local_governments(name) select distinct lga from import_staging on conflict do nothing;
insert into wards(lga_id,name) select distinct l.id, s.ward from import_staging s join local_governments l on l.name=s.lga on conflict do nothing;
insert into polling_units(ward_id,name,delimitation_code)
  select w.id, s.pu, s.code from import_staging s join local_governments l on l.name=s.lga join wards w on w.lga_id=l.id and w.name=s.ward on conflict do nothing;
drop table import_staging;
```
5. `cp .env.example .env.local`, fill the three values (Project Settings > API), then `npm install && npm run dev`.
6. Open `/admin/login`, create a sponsor, copy the token, test at `/`.

## Deploy on Vercel
Push to GitHub, import the repo in Vercel, add the three env vars (service role key as a normal, non-public variable), deploy. HTTPS is automatic. Add a Vercel Firewall rate limit on `/api/login`.

## Data protection
- Edit `app/privacy/page.tsx` (controller, DPO contact, retention period) with your lawyer. The add form requires a consent tick.
- Corrections and deletion: sponsors edit and delete their own rows; admin can do it on request.
- Retention: delete after the agreed period, e.g. `delete from supporter_records where created_at < now() - interval '2 years';` (run as admin).
- Backups: Supabase daily backups (Pro plan adds point-in-time recovery). Also keep encrypted `pg_dump` copies offsite and test a restore.
- Do not log personal data. Audit rows store ids only.
