-- Migration 00006: make pgcrypto lookups independent of WHERE the extension was installed.
-- 00005 called extensions.digest(...), which fails if pgcrypto lives in `public`
-- (create extension without a schema clause installs into the first schema of the
-- search_path). Unqualified digest() with search_path = public, extensions works in both cases.

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

  v_hash := encode(digest(p_token, 'sha256'), 'hex');

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

  select * into v_dose from public.dose_logs where id = v_alert.dose_log_id;
  select * into v_med from public.medications where id = v_dose.medication_id;

  select coalesce(jsonb_agg(jsonb_build_object('name', pr.full_name, 'phone', pr.phone)), '[]'::jsonb)
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

  v_hash := encode(digest(p_token, 'sha256'), 'hex');

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

-- CREATE OR REPLACE keeps existing grants, but state them explicitly.
revoke execute on function public.get_emergency_alert(text) from public;
revoke execute on function public.ack_emergency(text) from public;
grant execute on function public.get_emergency_alert(text) to anon, authenticated, service_role;
grant execute on function public.ack_emergency(text) to anon, authenticated, service_role;
