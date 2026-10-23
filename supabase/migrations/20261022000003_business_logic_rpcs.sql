-- Migration 00003: Core Business Logic RPCs, Security Definer Functions, and Cron Tick

-- ============================================================================
-- HELPER: GET APP SETTINGS VALUE
-- ============================================================================

create or replace function public.get_setting_int(p_key text, p_default integer)
returns integer as $$
declare
  val jsonb;
begin
  select value into val from public.app_settings where key = p_key;
  if val is null then
    return p_default;
  end if;
  return (val #>> '{}')::integer;
exception when others then
  return p_default;
end;
$$ language plpgsql stable security definer set search_path = public;

-- ============================================================================
-- 1. DOSE GENERATION
-- ============================================================================

create or replace function public.generate_doses(p_patient uuid, p_days integer default 14)
returns integer as $$
declare
  p_tz text;
  m record;
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

  for m in (
    select m.id, m.start_date, m.end_date, s.times, s.days_of_week
    from public.medications m
    join public.medication_schedules s on s.medication_id = m.id
    where m.patient_id = p_patient
      and m.is_active = true
      and m.deleted_at is null
  ) loop
    for i in 0..p_days loop
      d := current_date + i;
      
      -- Check start and end dates
      if d >= m.start_date and (m.end_date is null or d <= m.end_date) then
        -- In PostgreSQL: extract(dow from d) -> 0 is Sunday, 6 is Saturday
        day_idx := extract(dow from d)::smallint;

        if day_idx = any(m.days_of_week) then
          foreach t in array m.times loop
            -- Combine date and time in the patient's timezone
            target_ts := (d + t) at time zone p_tz;

            insert into public.dose_logs (
              patient_id,
              medication_id,
              scheduled_at,
              status
            ) values (
              p_patient,
              m.id,
              target_ts,
              'scheduled'
            ) on conflict (medication_id, scheduled_at) do nothing;

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

grant execute on function public.generate_doses(uuid, integer) to authenticated;

-- ============================================================================
-- 2. UPSERT MEDICATION WITH SCHEDULE
-- ============================================================================

create or replace function public.upsert_medication_with_schedule(
  p_id uuid,
  p_name text,
  p_generic text,
  p_strength text,
  p_form med_form,
  p_color text,
  p_dose_amount text,
  p_meal meal_rule,
  p_instructions text,
  p_start date,
  p_end date,
  p_times time[],
  p_days smallint[],
  p_updated_at timestamptz default now()
) returns uuid as $$
declare
  v_patient uuid := auth.uid();
  v_existing_updated_at timestamptz;
  v_med_id uuid;
begin
  if v_patient is null then
    raise exception 'Unauthorized';
  end if;

  v_med_id := coalesce(p_id, gen_random_uuid());

  -- Check last-write-wins by updated_at
  select updated_at into v_existing_updated_at
  from public.medications
  where id = v_med_id and patient_id = v_patient;

  if v_existing_updated_at is not null and v_existing_updated_at > p_updated_at then
    -- Incoming update is older than stored record; return without overwriting
    return v_med_id;
  end if;

  -- Upsert medication
  insert into public.medications (
    id,
    patient_id,
    name,
    generic_name,
    strength,
    form,
    color,
    dose_amount,
    meal,
    instructions,
    start_date,
    end_date,
    is_active,
    updated_at
  ) values (
    v_med_id,
    v_patient,
    p_name,
    p_generic,
    p_strength,
    p_form,
    p_color,
    p_dose_amount,
    p_meal,
    p_instructions,
    p_start,
    p_end,
    true,
    p_updated_at
  )
  on conflict (id) do update set
    name = excluded.name,
    generic_name = excluded.generic_name,
    strength = excluded.strength,
    form = excluded.form,
    color = excluded.color,
    dose_amount = excluded.dose_amount,
    meal = excluded.meal,
    instructions = excluded.instructions,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    is_active = true,
    deleted_at = null,
    updated_at = excluded.updated_at;

  -- Upsert schedule
  insert into public.medication_schedules (
    medication_id,
    times,
    days_of_week,
    updated_at
  ) values (
    v_med_id,
    p_times,
    p_days,
    p_updated_at
  )
  on conflict (medication_id) do update set
    times = excluded.times,
    days_of_week = excluded.days_of_week,
    updated_at = excluded.updated_at;

  -- Delete future 'scheduled' doses of this medication (preserve taken & missed)
  delete from public.dose_logs
  where medication_id = v_med_id
    and status = 'scheduled'
    and scheduled_at > now();

  -- Regenerate future doses
  perform public.generate_doses(v_patient, 14);

  return v_med_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.upsert_medication_with_schedule(
  uuid, text, text, text, med_form, text, text, meal_rule, text, date, date, time[], smallint[], timestamptz
) to authenticated;

-- ============================================================================
-- 3. DELETE MEDICATION (SOFT DELETE)
-- ============================================================================

create or replace function public.delete_medication(p_id uuid)
returns boolean as $$
declare
  v_patient uuid := auth.uid();
begin
  if v_patient is null then
    raise exception 'Unauthorized';
  end if;

  update public.medications
  set is_active = false,
      deleted_at = now(),
      updated_at = now()
  where id = p_id and patient_id = v_patient;

  if not found then
    return false;
  end if;

  -- Delete future scheduled doses
  delete from public.dose_logs
  where medication_id = p_id
    and status = 'scheduled'
    and scheduled_at > now();

  return true;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.delete_medication(uuid) to authenticated;

-- ============================================================================
-- 4. CONFIRM DOSE (IDEMPOTENT)
-- ============================================================================

create or replace function public.confirm_dose(
  p_dose_id uuid,
  p_taken_at timestamptz default now(),
  p_offline boolean default false
) returns boolean as $$
declare
  v_user uuid := auth.uid();
  v_dose record;
  v_early_mins integer;
  v_earliest timestamptz;
  v_effective_taken timestamptz;
  v_was_missed boolean;
  cg record;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  -- Lock dose row
  select * into v_dose
  from public.dose_logs
  where id = p_dose_id and patient_id = v_user
  for update;

  if not found then
    raise exception 'Dose not found or unauthorized';
  end if;

  -- Idempotent check: if already taken, return success without duplicate work
  if v_dose.status = 'taken' then
    return true;
  end if;

  v_early_mins := public.get_setting_int('early_window_minutes', 30);
  v_earliest := v_dose.scheduled_at - (v_early_mins || ' minutes')::interval;

  -- Verify confirmation window:
  -- Allowed if status = 'scheduled' and now() >= scheduled_at - early_window, OR status = 'missed'
  if v_dose.status = 'scheduled' and now() < v_earliest then
    raise exception 'Dose cannot be confirmed before the early window';
  end if;

  v_was_missed := (v_dose.status = 'missed');

  -- Clamp taken_at to [earliest, now()]
  v_effective_taken := coalesce(p_taken_at, now());
  if v_effective_taken < v_earliest then
    v_effective_taken := v_earliest;
  end if;
  if v_effective_taken > now() then
    v_effective_taken := now();
  end if;

  update public.dose_logs
  set status = 'taken',
      taken_at = v_effective_taken,
      was_late = v_was_missed,
      confirmed_offline = p_offline,
      escalation_next_at = null,
      updated_at = now()
  where id = p_dose_id;

  -- If missed alert was already sent (escalation_stage >= 1), notify active caregivers
  if v_dose.escalation_stage >= 1 then
    for cg in (
      select caregiver_id
      from public.care_links
      where patient_id = v_user and status = 'active'
    ) loop
      insert into public.alerts (
        dose_log_id,
        patient_id,
        kind,
        channel,
        recipient_user_id,
        status
      ) values (
        p_dose_id,
        v_user,
        'confirmed_notice',
        'in_app',
        cg.caregiver_id,
        'pending'
      );
    end loop;
  end if;

  return true;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.confirm_dose(uuid, timestamptz, boolean) to authenticated;

-- ============================================================================
-- 5. ADHERENCE CALCULATION
-- ============================================================================

create or replace function public.get_adherence(
  p_patient uuid,
  p_from date,
  p_to date
) returns jsonb as $$
declare
  v_user uuid := auth.uid();
  v_allowed boolean;
  v_taken bigint;
  v_missed bigint;
  v_total bigint;
  v_percent numeric;
  v_by_day jsonb;
begin
  if v_user is null then
    raise exception 'Unauthorized';
  end if;

  -- Security check: caller must be patient, linked caregiver, or doctor with consent
  v_allowed := (v_user = p_patient)
    or public.is_linked_caregiver(p_patient)
    or public.has_doctor_consent(p_patient);

  if not v_allowed then
    raise exception 'Unauthorized to view adherence for patient: %', p_patient;
  end if;

  -- Past scheduled doses only (future or still-scheduled doses in future are excluded)
  select
    count(*) filter (where status = 'taken'),
    count(*) filter (where status = 'missed')
  into v_taken, v_missed
  from public.dose_logs
  where patient_id = p_patient
    and scheduled_at::date between p_from and p_to
    and scheduled_at <= now();

  v_total := v_taken + v_missed;
  if v_total > 0 then
    v_percent := round((v_taken::numeric / v_total::numeric) * 100, 1);
  else
    v_percent := null;
  end if;

  -- Daily aggregation
  select jsonb_agg(d_row) into v_by_day
  from (
    select
      scheduled_at::date as date,
      count(*) filter (where status = 'taken') as taken,
      count(*) filter (where status = 'missed') as missed,
      count(*) as total,
      case
        when count(*) > 0 then round((count(*) filter (where status = 'taken')::numeric / count(*)::numeric) * 100, 1)
        else null
      end as percent
    from public.dose_logs
    where patient_id = p_patient
      and scheduled_at::date between p_from and p_to
      and scheduled_at <= now()
    group by scheduled_at::date
    order by scheduled_at::date
  ) d_row;

  return jsonb_build_object(
    'taken', v_taken,
    'missed', v_missed,
    'total', v_total,
    'percent', v_percent,
    'by_day', coalesce(v_by_day, '[]'::jsonb)
  );
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.get_adherence(uuid, date, date) to authenticated;

-- ============================================================================
-- 6. LINKING & CONSENT RPCS
-- ============================================================================

-- Rate limited caregiver link request
create or replace function public.request_caregiver_link(p_code text)
returns jsonb as $$
declare
  v_caregiver uuid := auth.uid();
  v_patient uuid;
  v_attempts integer;
begin
  if v_caregiver is null then
    raise exception 'Unauthorized';
  end if;

  -- Rate limit: max 10 attempts per hour per user
  select count(*) into v_attempts
  from public.access_log
  where viewer_id = v_caregiver
    and resource = 'link_attempt'
    and created_at > now() - interval '1 hour';

  if v_attempts >= 10 then
    return jsonb_build_object('success', false, 'message', 'Too many attempts. Please try again later.');
  end if;

  insert into public.access_log (patient_id, viewer_id, viewer_role, resource)
  values (coalesce((select id from public.patients where share_code = upper(trim(p_code))), v_caregiver), v_caregiver, 'caregiver', 'link_attempt');

  select id into v_patient
  from public.patients
  where share_code = upper(trim(p_code));

  if v_patient is null then
    return jsonb_build_object('success', false, 'message', 'Code not valid');
  end if;

  insert into public.care_links (patient_id, caregiver_id, status, requested_code)
  values (v_patient, v_caregiver, 'pending', upper(trim(p_code)))
  on conflict (patient_id, caregiver_id) do update set
    status = 'pending',
    requested_code = excluded.requested_code,
    updated_at = now();

  return jsonb_build_object('success', true, 'message', 'Request sent');
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.request_caregiver_link(text) to authenticated;

create or replace function public.respond_care_link(p_id uuid, p_accept boolean)
returns boolean as $$
declare
  v_user uuid := auth.uid();
begin
  update public.care_links
  set status = case when p_accept then 'active'::link_status else 'rejected'::link_status end,
      responded_at = now(),
      updated_at = now()
  where id = p_id and patient_id = v_user;

  return found;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.respond_care_link(uuid, boolean) to authenticated;

create or replace function public.revoke_care_link(p_id uuid)
returns boolean as $$
declare
  v_user uuid := auth.uid();
begin
  update public.care_links
  set status = 'revoked',
      updated_at = now()
  where id = p_id and (patient_id = v_user or caregiver_id = v_user);

  return found;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.revoke_care_link(uuid) to authenticated;

create or replace function public.request_doctor_consent(p_code text)
returns jsonb as $$
declare
  v_doctor uuid := auth.uid();
  v_patient uuid;
begin
  if v_doctor is null then
    raise exception 'Unauthorized';
  end if;

  select id into v_patient
  from public.patients
  where share_code = upper(trim(p_code));

  if v_patient is null then
    return jsonb_build_object('success', false, 'message', 'Code not valid');
  end if;

  insert into public.doctor_consents (patient_id, doctor_id, status, requested_code)
  values (v_patient, v_doctor, 'pending', upper(trim(p_code)))
  on conflict (patient_id, doctor_id) do update set
    status = 'pending',
    requested_code = excluded.requested_code,
    updated_at = now();

  return jsonb_build_object('success', true, 'message', 'Request sent');
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.request_doctor_consent(text) to authenticated;

create or replace function public.respond_doctor_consent(p_id uuid, p_accept boolean)
returns boolean as $$
declare
  v_user uuid := auth.uid();
begin
  update public.doctor_consents
  set status = case when p_accept then 'given'::consent_status else 'rejected'::consent_status end,
      decided_at = now(),
      updated_at = now()
  where id = p_id and patient_id = v_user;

  return found;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.respond_doctor_consent(uuid, boolean) to authenticated;

create or replace function public.withdraw_doctor_consent(p_id uuid)
returns boolean as $$
declare
  v_user uuid := auth.uid();
begin
  update public.doctor_consents
  set status = 'withdrawn',
      decided_at = now(),
      updated_at = now()
  where id = p_id and patient_id = v_user;

  return found;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.withdraw_doctor_consent(uuid) to authenticated;

create or replace function public.regenerate_share_code()
returns text as $$
declare
  v_user uuid := auth.uid();
  v_new_code text;
begin
  v_new_code := public.generate_unique_share_code();

  update public.patients
  set share_code = v_new_code,
      updated_at = now()
  where id = v_user;

  return v_new_code;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.regenerate_share_code() to authenticated;

create or replace function public.log_access(p_patient uuid, p_resource text)
returns boolean as $$
declare
  v_user uuid := auth.uid();
  v_role user_role;
begin
  if v_user is null then
    return false;
  end if;

  select role into v_role from public.profiles where id = v_user;

  insert into public.access_log (patient_id, viewer_id, viewer_role, resource)
  values (p_patient, v_user, v_role, p_resource);

  return true;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.log_access(uuid, text) to authenticated;

create or replace function public.mark_alert_seen(p_id uuid)
returns boolean as $$
declare
  v_user uuid := auth.uid();
begin
  update public.alerts
  set status = 'seen',
      seen_at = now(),
      updated_at = now()
  where id = p_id and recipient_user_id = v_user;

  return found;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.mark_alert_seen(uuid) to authenticated;

create or replace function public.set_demo_mode(p_on boolean)
returns boolean as $$
declare
  v_user uuid := auth.uid();
begin
  update public.patients
  set demo_mode = p_on,
      updated_at = now()
  where id = v_user;

  return found;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.set_demo_mode(boolean) to authenticated;

create or replace function public.create_demo_dose()
returns uuid as $$
declare
  v_user uuid := auth.uid();
  v_med uuid;
  v_dose_id uuid;
begin
  select id into v_med
  from public.medications
  where patient_id = v_user and is_active = true and deleted_at is null
  limit 1;

  if v_med is null then
    raise exception 'No active medication found to create demo dose';
  end if;

  v_dose_id := gen_random_uuid();

  insert into public.dose_logs (
    id,
    patient_id,
    medication_id,
    scheduled_at,
    status
  ) values (
    v_dose_id,
    v_user,
    v_med,
    now() + interval '1 minute',
    'scheduled'
  );

  return v_dose_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.create_demo_dose() to authenticated;

-- ============================================================================
-- 7. EMERGENCY ALERTS & PUBLIC TOKEN FUNCTIONS (CALLABLE BY ANON)
-- ============================================================================

create or replace function public.get_emergency_alert(p_token text)
returns jsonb as $$
declare
  v_hash text;
  v_alert record;
  v_patient record;
  v_med record;
  v_mins_overdue integer;
  v_caregiver_phones text[];
begin
  v_hash := encode(digest(p_token, 'sha256'), 'hex');

  select * into v_alert
  from public.alerts
  where token_hash = v_hash
    and token_expires_at > now();

  if not found then
    return null;
  end if;

  select * into v_patient
  from public.patients
  where id = v_alert.patient_id;

  select * into v_med
  from public.medications
  where id = (select medication_id from public.dose_logs where id = v_alert.dose_log_id);

  select array_agg(p.phone) into v_caregiver_phones
  from public.care_links cl
  join public.profiles p on p.id = cl.caregiver_id
  where cl.patient_id = v_alert.patient_id and cl.status = 'active' and p.phone is not null;

  v_mins_overdue := extract(epoch from (now() - (select scheduled_at from public.dose_logs where id = v_alert.dose_log_id))) / 60;

  return jsonb_build_object(
    'alert_id', v_alert.id,
    'patient_name', (select full_name from public.profiles where id = v_alert.patient_id),
    'patient_phone', (select phone from public.profiles where id = v_alert.patient_id),
    'medication_name', v_med.name,
    'strength', v_med.strength,
    'dose_amount', v_med.dose_amount,
    'scheduled_at', (select scheduled_at from public.dose_logs where id = v_alert.dose_log_id),
    'minutes_overdue', greatest(0, v_mins_overdue),
    'blood_type', v_patient.blood_type,
    'chronic_conditions', v_patient.chronic_conditions,
    'allergies', v_patient.allergies,
    'caregiver_phones', coalesce(v_caregiver_phones, '{}'),
    'acknowledged', (v_alert.acknowledged_at is not null)
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.ack_emergency(p_token text)
returns boolean as $$
declare
  v_hash text;
begin
  v_hash := encode(digest(p_token, 'sha256'), 'hex');

  update public.alerts
  set status = 'acknowledged',
      acknowledged_at = now(),
      updated_at = now()
  where token_hash = v_hash
    and token_expires_at > now();

  return found;
end;
$$ language plpgsql security definer set search_path = public;

-- Grant execution of emergency public RPCs to anon and authenticated
grant execute on function public.get_emergency_alert(text) to anon, authenticated;
grant execute on function public.ack_emergency(text) to anon, authenticated;

-- ============================================================================
-- 8. SYSTEM TICK & HORIZON EXTENSION
-- ============================================================================

create or replace function public.run_tick()
returns jsonb as $$
declare
  v_reminders_count integer := 0;
  v_missed_count integer := 0;
  v_escalations_count integer := 0;
  r record;
  cg record;
  ec record;
  v_demo boolean;
  v_allowed_mins integer;
  v_followup_mins integer;
  v_delay_mins integer;
  v_raw_token text;
  v_token_hash text;
  v_token_ttl_hours integer;
  v_has_cg boolean;
  v_has_ec boolean;
begin
  -- 1. Reminders: for scheduled doses scheduled now or past with no reminder sent
  for r in (
    select id, patient_id, scheduled_at
    from public.dose_logs
    where status = 'scheduled'
      and reminder_sent_at is null
      and scheduled_at <= now()
  ) loop
    insert into public.alerts (
      dose_log_id,
      patient_id,
      kind,
      channel,
      recipient_user_id,
      status
    ) values (
      r.id,
      r.patient_id,
      'reminder',
      'push',
      r.patient_id,
      'pending'
    );

    update public.dose_logs
    set reminder_sent_at = now(),
        updated_at = now()
    where id = r.id;

    v_reminders_count := v_reminders_count + 1;
  end loop;

  -- 2. Mark missed doses: scheduled and overdue by allowed_minutes
  -- Supports demo mode (1 minute) per patient
  for r in (
    select d.id, d.patient_id, d.scheduled_at, p.demo_mode
    from public.dose_logs d
    join public.patients p on p.id = d.patient_id
    where d.status = 'scheduled'
  ) loop
    v_allowed_mins := case when r.demo_mode then 1 else public.get_setting_int('allowed_minutes', 30) end;

    if r.scheduled_at + (v_allowed_mins || ' minutes')::interval <= now() then
      update public.dose_logs
      set status = 'missed',
          missed_at = now(),
          escalation_stage = 0,
          escalation_next_at = now(),
          updated_at = now()
      where id = r.id;

      v_missed_count := v_missed_count + 1;
    end if;
  end loop;

  -- 3. Escalations: missed doses where escalation_next_at <= now() and stage < 4
  for r in (
    select d.id, d.patient_id, d.escalation_stage, p.demo_mode
    from public.dose_logs d
    join public.patients p on p.id = d.patient_id
    where d.status = 'missed'
      and d.escalation_next_at <= now()
      and d.escalation_stage < 4
    for update skip locked
  ) loop
    v_followup_mins := case when r.demo_mode then 1 else public.get_setting_int('followup_interval_minutes', 15) end;
    v_delay_mins := case when r.demo_mode then 1 else public.get_setting_int('emergency_delay_minutes', 15) end;
    v_token_ttl_hours := public.get_setting_int('emergency_link_ttl_hours', 12);

    -- Check caregiver presence
    select exists (
      select 1 from public.care_links where patient_id = r.patient_id and status = 'active'
    ) into v_has_cg;

    -- Stage 0 -> 1: Missed alert to caregivers
    if r.escalation_stage = 0 then
      if v_has_cg then
        for cg in (
          select caregiver_id from public.care_links where patient_id = r.patient_id and status = 'active'
        ) loop
          insert into public.alerts (dose_log_id, patient_id, kind, channel, recipient_user_id, status)
          values (r.id, r.patient_id, 'missed', 'push', cg.caregiver_id, 'pending'),
                 (r.id, r.patient_id, 'missed', 'in_app', cg.caregiver_id, 'pending');
        end loop;
      else
        insert into public.alerts (dose_log_id, patient_id, kind, channel, status)
        values (r.id, r.patient_id, 'missed', 'push', 'skipped_no_recipient');
      end if;

      update public.dose_logs
      set escalation_stage = 1,
          escalation_next_at = now() + (v_followup_mins || ' minutes')::interval,
          updated_at = now()
      where id = r.id;

    -- Stage 1 -> 2: Followup 1
    elsif r.escalation_stage = 1 then
      if v_has_cg then
        for cg in (
          select caregiver_id from public.care_links where patient_id = r.patient_id and status = 'active'
        ) loop
          insert into public.alerts (dose_log_id, patient_id, kind, channel, recipient_user_id, status)
          values (r.id, r.patient_id, 'followup_1', 'push', cg.caregiver_id, 'pending'),
                 (r.id, r.patient_id, 'followup_1', 'in_app', cg.caregiver_id, 'pending');
        end loop;
      end if;

      update public.dose_logs
      set escalation_stage = 2,
          escalation_next_at = now() + (v_followup_mins || ' minutes')::interval,
          updated_at = now()
      where id = r.id;

    -- Stage 2 -> 3: Followup 2
    elsif r.escalation_stage = 2 then
      if v_has_cg then
        for cg in (
          select caregiver_id from public.care_links where patient_id = r.patient_id and status = 'active'
        ) loop
          insert into public.alerts (dose_log_id, patient_id, kind, channel, recipient_user_id, status)
          values (r.id, r.patient_id, 'followup_2', 'push', cg.caregiver_id, 'pending'),
                 (r.id, r.patient_id, 'followup_2', 'in_app', cg.caregiver_id, 'pending');
        end loop;
      end if;

      update public.dose_logs
      set escalation_stage = 3,
          escalation_next_at = now() + (v_delay_mins || ' minutes')::interval,
          updated_at = now()
      where id = r.id;

    -- Stage 3 -> 4: Emergency Contacts
    elsif r.escalation_stage = 3 then
      select exists (
        select 1 from public.emergency_contacts where patient_id = r.patient_id
      ) into v_has_ec;

      if v_has_ec then
        for ec in (
          select id, email from public.emergency_contacts where patient_id = r.patient_id
        ) loop
          -- Generate secure 32-byte hex token
          v_raw_token := encode(gen_random_bytes(32), 'hex');
          v_token_hash := encode(digest(v_raw_token, 'sha256'), 'hex');

          declare
            v_alert_id uuid;
          begin
            insert into public.alerts (
              dose_log_id,
              patient_id,
              kind,
              channel,
              emergency_contact_id,
              token_hash,
              token_expires_at,
              status
            ) values (
              r.id,
              r.patient_id,
              'emergency',
              'email',
              ec.id,
              v_token_hash,
              now() + (v_token_ttl_hours || ' hours')::interval,
              'pending'
            ) returning id into v_alert_id;

            -- Store raw token in service-only emergency_dispatch
            insert into public.emergency_dispatch (alert_id, token_plain)
            values (v_alert_id, v_raw_token);
          end;
        end loop;
      else
        -- No emergency contact saved
        insert into public.alerts (dose_log_id, patient_id, kind, channel, status)
        values (r.id, r.patient_id, 'emergency', 'email', 'skipped_no_recipient');

        -- Notify caregivers that no emergency contact is saved
        for cg in (
          select caregiver_id from public.care_links where patient_id = r.patient_id and status = 'active'
        ) loop
          insert into public.alerts (dose_log_id, patient_id, kind, channel, recipient_user_id, status)
          values (r.id, r.patient_id, 'no_emergency_contact_notice', 'in_app', cg.caregiver_id, 'pending');
        end loop;
      end if;

      update public.dose_logs
      set escalation_stage = 4,
          escalation_next_at = null,
          updated_at = now()
      where id = r.id;
    end if;

    v_escalations_count := v_escalations_count + 1;
  end loop;

  return jsonb_build_object(
    'reminders', v_reminders_count,
    'missed', v_missed_count,
    'escalations', v_escalations_count
  );
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.extend_dose_horizon()
returns integer as $$
declare
  p record;
  v_count integer := 0;
begin
  for p in (select id from public.patients) loop
    v_count := v_count + public.generate_doses(p.id, 14);
  end loop;

  -- Clean up expired tokens
  update public.alerts
  set status = 'failed',
      last_error = 'Token expired'
  where token_expires_at is not null
    and token_expires_at <= now()
    and status = 'pending';

  return v_count;
end;
$$ language plpgsql security definer set search_path = public;
