-- pgTAP test suite for DoseMinder RLS, triggers and security guarantees.
-- Run with:  supabase test db
--
-- (a) caregiver cannot read an unlinked patient
-- (b) doctor cannot read without consent, and loses access after withdrawal
-- (c) user cannot change their role
-- (d) patient cannot insert/update dose_logs directly
-- (e) anon cannot read any table
-- (f) emergency token functions reject unknown tokens (also proves pgcrypto digest() resolves)
-- (g) confirm_dose is idempotent
-- (h) internal functions (run_tick, ...) are not callable by anon / authenticated
-- (i) patients.share_code / demo_mode can only change through the RPCs
-- (j) signup trigger: missing role defaults to patient, invalid role rejected

begin;
select plan(27);

-- ----------------------------------------------------------------------------
-- Fixtures (fixed UUIDs so the JWT claims always match the seeded rows)
-- ----------------------------------------------------------------------------
create temp table _test_vars (
  patient1_id uuid, patient2_id uuid, caregiver_id uuid, doctor_id uuid, med_id uuid, dose_id uuid
);
grant select on _test_vars to anon, authenticated, service_role;

insert into _test_vars values (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  gen_random_uuid(),
  gen_random_uuid()
);

-- profiles.id references auth.users, so create the auth users first.
-- The signup trigger is disabled while seeding; it is tested explicitly in (j).
alter table auth.users disable trigger on_auth_user_created;

insert into auth.users (id, email)
select unnest(array[patient1_id, patient2_id, caregiver_id, doctor_id]), null from _test_vars;

insert into public.profiles (id, role, full_name, locale)
values
  ((select patient1_id from _test_vars), 'patient', 'Patient One', 'ar'),
  ((select patient2_id from _test_vars), 'patient', 'Patient Two', 'ar'),
  ((select caregiver_id from _test_vars), 'caregiver', 'Caregiver One', 'ar'),
  ((select doctor_id from _test_vars), 'doctor', 'Doctor One', 'ar');

insert into public.patients (id, share_code)
values
  ((select patient1_id from _test_vars), 'DM-TEST01'),
  ((select patient2_id from _test_vars), 'DM-TEST02');

insert into public.medications (id, patient_id, name, dose_amount)
values ((select med_id from _test_vars), (select patient1_id from _test_vars), 'Concor 5mg', '1 tablet');

insert into public.medication_schedules (medication_id, times, days_of_week)
values ((select med_id from _test_vars), array['08:00:00'::time], array[0,1,2,3,4,5,6]::smallint[]);

insert into public.dose_logs (id, patient_id, medication_id, scheduled_at, status)
values ((select dose_id from _test_vars), (select patient1_id from _test_vars), (select med_id from _test_vars), now() - interval '10 minutes', 'scheduled');

-- ----------------------------------------------------------------------------
-- (a) Caregiver cannot read unlinked patient
-- ----------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "33333333-3333-3333-3333-333333333333"}';

select is_empty(
  'select * from public.patients where id = ''11111111-1111-1111-1111-111111111111''',
  '(a) Caregiver cannot read unlinked patient'
);

-- ----------------------------------------------------------------------------
-- (b) Doctor consent
-- ----------------------------------------------------------------------------
set local "request.jwt.claims" to '{"sub": "44444444-4444-4444-4444-444444444444"}';

select is_empty(
  'select * from public.patients where id = ''11111111-1111-1111-1111-111111111111''',
  '(b.1) Doctor cannot read patient before consent is given'
);

reset role;
insert into public.doctor_consents (patient_id, doctor_id, status)
values ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'given');

set local role authenticated;
set local "request.jwt.claims" to '{"sub": "44444444-4444-4444-4444-444444444444"}';
select results_eq(
  'select id from public.patients where id = ''11111111-1111-1111-1111-111111111111''',
  'select patient1_id from _test_vars',
  '(b.2) Doctor can read patient while consent is given'
);

reset role;
update public.doctor_consents set status = 'withdrawn'
where patient_id = '11111111-1111-1111-1111-111111111111'
  and doctor_id = '44444444-4444-4444-4444-444444444444';

set local role authenticated;
set local "request.jwt.claims" to '{"sub": "44444444-4444-4444-4444-444444444444"}';
select is_empty(
  'select * from public.patients where id = ''11111111-1111-1111-1111-111111111111''',
  '(b.3) Doctor loses access immediately upon consent withdrawal'
);

-- ----------------------------------------------------------------------------
-- (c) User cannot change their role
-- ----------------------------------------------------------------------------
reset role;
select throws_ok(
  'update public.profiles set role = ''doctor'' where id = ''11111111-1111-1111-1111-111111111111''',
  'P0001',
  'Account role cannot be changed once registered.',
  '(c.1) User cannot change their role (prevent_role_change trigger)'
);

set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111"}';
select throws_ok(
  'update public.profiles set role = ''doctor'' where id = ''11111111-1111-1111-1111-111111111111''',
  '42501', null, '(c.2) Authenticated user cannot update role column (column grant revoked)'
);

-- ----------------------------------------------------------------------------
-- (d) Patient cannot write dose_logs directly (RPC only)
-- ----------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select throws_ok(
  'insert into public.dose_logs (patient_id, medication_id, scheduled_at) values (''11111111-1111-1111-1111-111111111111'', (select med_id from _test_vars), now())',
  '42501', null, '(d.1) Patient cannot insert into dose_logs directly'
);

-- No UPDATE policy exists, so RLS silently filters the row: 0 rows are changed.
select is_empty(
  'update public.dose_logs set status = ''taken'' where id = (select dose_id from _test_vars) returning id',
  '(d.2) Patient cannot update dose_logs directly (0 rows affected)'
);

-- ----------------------------------------------------------------------------
-- (e) Anon cannot read any table
-- ----------------------------------------------------------------------------
reset role;
set local role anon;

select throws_ok('select * from public.profiles', '42501', null, '(e.1) Anon cannot select from profiles');
select throws_ok('select * from public.dose_logs', '42501', null, '(e.2) Anon cannot select from dose_logs');

-- ----------------------------------------------------------------------------
-- (f) Emergency token functions (anon-callable) reject unknown tokens.
--     Reaching "null" also proves digest() from pgcrypto resolves correctly.
-- ----------------------------------------------------------------------------
select is(
  public.get_emergency_alert('nonexistent_token_12345678901234567890'),
  null::jsonb,
  '(f.1) get_emergency_alert returns null for unknown token'
);

select is(
  public.ack_emergency('nonexistent_token_12345678901234567890'),
  false,
  '(f.2) ack_emergency returns false for unknown token'
);

-- ----------------------------------------------------------------------------
-- (g) confirm_dose is idempotent
-- ----------------------------------------------------------------------------
reset role;
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select ok(public.confirm_dose((select dose_id from _test_vars)), '(g.1) First call to confirm_dose succeeds');
select ok(public.confirm_dose((select dose_id from _test_vars)), '(g.2) Second call to confirm_dose is idempotent');

-- ----------------------------------------------------------------------------
-- (h) Internal functions are not callable by anon / authenticated
-- ----------------------------------------------------------------------------
reset role;
set local role anon;
select throws_ok('select public.run_tick()', '42501', null, '(h.1) anon cannot call run_tick');
select throws_ok('select public.extend_dose_horizon()', '42501', null, '(h.2) anon cannot call extend_dose_horizon');
select throws_ok('select public.get_setting_int(''x'', 1)', '42501', null, '(h.3) anon cannot call get_setting_int');
select throws_ok(
  'select public.generate_doses(''11111111-1111-1111-1111-111111111111'', 14)',
  '42501', null, '(h.4) anon cannot call generate_doses'
);

reset role;
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111"}';
select throws_ok('select public.run_tick()', '42501', null, '(h.5) authenticated cannot call run_tick');
select throws_ok(
  'select public.generate_doses(''11111111-1111-1111-1111-111111111111'', 14)',
  '42501', null, '(h.6) authenticated cannot call generate_doses'
);

reset role;
set local role service_role;
select cmp_ok(
  public.generate_doses('11111111-1111-1111-1111-111111111111', 14),
  '>', 0,
  '(h.7) service_role can generate doses (and doses are created)'
);
select lives_ok('select public.run_tick()', '(h.8) service_role can call run_tick');

-- ----------------------------------------------------------------------------
-- (i) share_code / demo_mode only through the RPCs
-- ----------------------------------------------------------------------------
reset role;
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "11111111-1111-1111-1111-111111111111"}';
select throws_ok(
  'update public.patients set share_code = ''DM-HACK01'' where id = ''11111111-1111-1111-1111-111111111111''',
  '42501', null, '(i.1) patient cannot edit share_code directly'
);
select throws_ok(
  'update public.patients set demo_mode = true where id = ''11111111-1111-1111-1111-111111111111''',
  '42501', null, '(i.2) patient cannot edit demo_mode directly'
);
select ok(public.set_demo_mode(true), '(i.3) patient can still change demo_mode through the RPC');

-- ----------------------------------------------------------------------------
-- (j) Signup trigger
-- ----------------------------------------------------------------------------
reset role;
alter table auth.users enable trigger on_auth_user_created;

select lives_ok(
  $$insert into auth.users (id, email) values ('55555555-5555-5555-5555-555555555555', 'dash@example.com')$$,
  '(j.1) user without role metadata can be created (dashboard / invite)'
);
select is(
  (select role::text from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
  'patient',
  '(j.2) missing role defaults to patient'
);
select throws_ok(
  $$insert into auth.users (id, email, raw_user_meta_data) values ('66666666-6666-6666-6666-666666666666', 'bad@example.com', '{"role":"admin"}')$$,
  'P0001', null, '(j.3) invalid role is still rejected'
);

select * from finish();
rollback;
