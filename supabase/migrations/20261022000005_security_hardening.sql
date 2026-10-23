-- Migration 00005: Security hardening
-- Safe to run on top of migrations 00001-00004 (idempotent / create or replace).

-- ============================================================================
-- 1. FUNCTION EXECUTE PRIVILEGES
-- Postgres and Supabase default privileges give EXECUTE on new functions to
-- PUBLIC / anon / authenticated. Revoke everything from PUBLIC/anon/authenticated,
-- then explicitly grant only to the roles that need them.
-- ============================================================================

revoke execute on all functions in schema public from public, anon, authenticated;

-- Future functions created by this role are NOT executable by default.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Internal / system functions: service_role (and database owner) ONLY
-- (run_tick, extend_dose_horizon, generate_doses, get_setting_int)
revoke execute on function public.run_tick() from public, anon, authenticated;
grant execute on function public.run_tick() to service_role;

revoke execute on function public.extend_dose_horizon() from public, anon, authenticated;
grant execute on function public.extend_dose_horizon() to service_role;

revoke execute on function public.generate_doses(uuid, integer) from public, anon, authenticated;
grant execute on function public.generate_doses(uuid, integer) to service_role;

revoke execute on function public.get_setting_int(text, integer) from public, anon, authenticated;
grant execute on function public.get_setting_int(text, integer) to service_role;

-- Public emergency-link RPCs (token-based, used from the unauthenticated emergency page)
grant execute on function public.get_emergency_alert(text) to anon, authenticated, service_role;
grant execute on function public.ack_emergency(text) to anon, authenticated, service_role;

-- RLS helper functions (used inside policies evaluated as the signed-in user)
grant execute on function public.has_doctor_consent(uuid) to authenticated, service_role;
grant execute on function public.is_linked_caregiver(uuid) to authenticated, service_role;

-- RPCs called by the signed-in application (authenticated users)
grant execute on function public.upsert_medication_with_schedule(
  uuid, text, text, text, med_form, text, text, meal_rule, text, date, date, time[], smallint[], timestamptz
) to authenticated, service_role;
grant execute on function public.delete_medication(uuid) to authenticated, service_role;
grant execute on function public.confirm_dose(uuid, timestamptz, boolean) to authenticated, service_role;
grant execute on function public.get_adherence(uuid, date, date) to authenticated, service_role;
grant execute on function public.request_caregiver_link(text) to authenticated, service_role;
grant execute on function public.respond_care_link(uuid, boolean) to authenticated, service_role;
grant execute on function public.revoke_care_link(uuid) to authenticated, service_role;
grant execute on function public.request_doctor_consent(text) to authenticated, service_role;
grant execute on function public.respond_doctor_consent(uuid, boolean) to authenticated, service_role;
grant execute on function public.withdraw_doctor_consent(uuid) to authenticated, service_role;
grant execute on function public.regenerate_share_code() to authenticated, service_role;
grant execute on function public.log_access(uuid, text) to authenticated, service_role;
grant execute on function public.mark_alert_seen(uuid) to authenticated, service_role;
grant execute on function public.set_demo_mode(boolean) to authenticated, service_role;
grant execute on function public.create_demo_dose() to authenticated, service_role;

-- ============================================================================
-- 2. generate_doses: internal / service_role only.
-- Called by upsert_medication_with_schedule and extend_dose_horizon (both security definer).
-- anon and authenticated cannot call generate_doses directly.
-- ============================================================================

create or replace function public.generate_doses(p_patient uuid, p_days integer default 14)
returns integer as $$
declare
  p_tz text;
  med record;
  d date;
  t time;
  day_idx smallint;
  target_ts timestamptz;
  doses_created integer := 0;
begin
  select timezone into p_tz from public.patients where id = p_patient;
  if p_tz is null then
    p_tz := 'Africa/Cairo';
  end if;

  for med in (
    select md.id, md.start_date, md.end_date, s.times, s.days_of_week
    from public.medications md
    join public.medication_schedules s on s.medication_id = md.id
    where md.patient_id = p_patient
      and md.is_active = true
      and md.deleted_at is null
  ) loop
    for i in 0..p_days loop
      d := current_date + i;

      if d >= med.start_date and (med.end_date is null or d <= med.end_date) then
        day_idx := extract(dow from d)::smallint;

        if day_idx = any(med.days_of_week) then
          foreach t in array med.times loop
            target_ts := (d + t) at time zone p_tz;

            insert into public.dose_logs (patient_id, medication_id, scheduled_at, status)
            values (p_patient, med.id, target_ts, 'scheduled')
            on conflict (medication_id, scheduled_at) do nothing;

            if found then
              doses_created := doses_created + 1;
            end if;
          end loop;
        end if;
      end if;
    end loop;
  end loop;

  return doses_created;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.generate_doses(uuid, integer) from public, anon, authenticated;
grant execute on function public.generate_doses(uuid, integer) to service_role;

-- ============================================================================
-- 3. pgcrypto lives in the `extensions` schema on Supabase.
-- Use extensions.digest / gen_random_bytes and add extensions to search_path.
-- ============================================================================

create or replace function public.get_emergency_alert(p_token text)
returns jsonb as $$
declare
  v_hash text;
  v_alert record;
  v_patient record;
  v_med record;
  v_dose record;
  v_caregivers jsonb;
begin
  if p_token is null or length(p_token) < 16 then
    return null;
  end if;

  -- Use extensions.digest explicitly to resolve pgcrypto in Supabase
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  select * into v_alert
  from public.alerts
  where token_hash = v_hash
    and token_expires_at > now()
  limit 1;

  if not found then
    return null;
  end if;

  select p.id, pr.full_name, pr.phone, p.blood_type, p.chronic_conditions, p.allergies
  into v_patient
  from public.patients p
  join public.profiles pr on pr.id = p.id
  where p.id = v_alert.patient_id;

  select * into v_dose
  from public.dose_logs
  where id = v_alert.dose_log_id;

  select * into v_med
  from public.medications
  where id = v_dose.medication_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'name', pr.full_name,
    'phone', pr.phone
  )), '[]'::jsonb)
  into v_caregivers
  from public.care_links cl
  join public.profiles pr on pr.id = cl.caregiver_id
  where cl.patient_id = v_alert.patient_id
    and cl.status = 'active';

  return jsonb_build_object(
    'patient_name', v_patient.full_name,
    'patient_phone', v_patient.phone,
    'medication_name', v_med.name,
    'medication_strength', v_med.strength,
    'dose_amount', v_med.dose_amount,
    'scheduled_at', v_dose.scheduled_at,
    'minutes_overdue', greatest(0, floor(extract(epoch from (now() - v_dose.scheduled_at)) / 60)::int),
    'blood_type', v_patient.blood_type,
    'chronic_conditions', v_patient.chronic_conditions,
    'allergies', v_patient.allergies,
    'caregivers', v_caregivers,
    'acknowledged', (v_alert.acknowledged_at is not null)
  );
end;
$$ language plpgsql security definer set search_path = public, extensions;

create or replace function public.ack_emergency(p_token text)
returns boolean as $$
declare
  v_hash text;
  v_alert_id uuid;
begin
  if p_token is null or length(p_token) < 16 then
    return false;
  end if;

  -- Use extensions.digest explicitly to resolve pgcrypto in Supabase
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  select id into v_alert_id
  from public.alerts
  where token_hash = v_hash
    and token_expires_at > now()
  limit 1;

  if not found then
    return false;
  end if;

  update public.alerts
  set status = 'acknowledged',
      acknowledged_at = coalesce(acknowledged_at, now())
  where id = v_alert_id;

  return true;
end;
$$ language plpgsql security definer set search_path = public, extensions;

alter function public.get_emergency_alert(text) set search_path = public, extensions;
alter function public.ack_emergency(text)       set search_path = public, extensions;
alter function public.run_tick()                set search_path = public, extensions;

-- ============================================================================
-- 4. COLUMN-LEVEL UPDATE PERMISSIONS
-- patients: authenticated users can only update medical/personal profile fields.
-- Direct updates to share_code and demo_mode are blocked.
-- profiles: authenticated users can update display/contact settings, but NEVER role.
-- ============================================================================

revoke update on public.patients from authenticated;
grant update (
  date_of_birth,
  gender,
  blood_type,
  chronic_conditions,
  allergies,
  lives_alone,
  timezone
) on public.patients to authenticated;

revoke update on public.profiles from authenticated;
grant update (
  full_name,
  phone,
  specialty,
  locale,
  numerals,
  font_scale,
  high_contrast,
  voice_enabled,
  theme
) on public.profiles to authenticated;

-- ============================================================================
-- 5. handle_new_user: safe default for dashboard / invite creations.
-- If no role is provided in raw_user_meta_data, default to 'patient'.
-- Any role explicitly provided MUST be valid ('patient', 'caregiver', 'doctor').
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_role text;
  valid_role user_role;
  raw_full_name text;
  raw_phone text;
  raw_specialty text;
  raw_locale text;
begin
  raw_role := new.raw_user_meta_data ->> 'role';

  if raw_role is null or raw_role = '' then
    raw_role := 'patient';
  elsif raw_role not in ('patient', 'caregiver', 'doctor') then
    raise exception 'Invalid user role: %', raw_role;
  end if;
  valid_role := raw_role::user_role;

  raw_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'User');
  raw_phone := new.raw_user_meta_data ->> 'phone';
  raw_specialty := new.raw_user_meta_data ->> 'specialty';
  raw_locale := coalesce(new.raw_user_meta_data ->> 'locale', 'ar');
  if raw_locale not in ('ar', 'en') then
    raw_locale := 'ar';
  end if;

  insert into public.profiles (id, role, full_name, phone, specialty, locale)
  values (new.id, valid_role, raw_full_name, raw_phone, raw_specialty, raw_locale);

  if valid_role = 'patient' then
    insert into public.patients (id, share_code)
    values (new.id, public.generate_unique_share_code());
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
