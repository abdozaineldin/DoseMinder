-- Migration 00001: Initial Schema (Enums, Tables, Indexes, RLS Enablement)
-- Schema: public, Timestamps: timestamptz UTC, IDs: uuid

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 5.1 ENUMS
-- ============================================================================

create type user_role as enum ('patient', 'caregiver', 'doctor');
create type link_status as enum ('pending', 'active', 'rejected', 'revoked');
create type consent_status as enum ('pending', 'given', 'rejected', 'withdrawn');
create type dose_status as enum ('scheduled', 'taken', 'missed');
create type alert_kind as enum (
  'reminder',
  'missed',
  'followup_1',
  'followup_2',
  'emergency',
  'confirmed_notice',
  'no_emergency_contact_notice'
);
create type alert_channel as enum ('push', 'in_app', 'email');
create type alert_status as enum (
  'pending',
  'sent',
  'failed',
  'skipped_no_recipient',
  'seen',
  'acknowledged'
);
create type med_form as enum (
  'tablet',
  'capsule',
  'syrup',
  'injection',
  'drops',
  'cream',
  'inhaler',
  'other'
);
create type meal_rule as enum ('before', 'with', 'after', 'any');

-- ============================================================================
-- TIMESTAMP TRIGGER FUNCTION
-- ============================================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- 5.2 TABLES
-- ============================================================================

-- 1. profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null,
  phone text,
  specialty text,
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  numerals text not null default 'latn' check (numerals in ('latn', 'arab')),
  font_scale smallint not null default 1 check (font_scale between 1 and 3),
  high_contrast boolean not null default false,
  voice_enabled boolean not null default false,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_profiles_updated_at
  before update on public.profiles
  for each row execute function set_updated_at();

-- 2. patients
create table public.patients (
  id uuid primary key references public.profiles(id) on delete cascade,
  date_of_birth date,
  gender text check (gender in ('male', 'female')),
  blood_type text check (blood_type in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  chronic_conditions text[] not null default '{}',
  allergies text[] not null default '{}',
  lives_alone boolean not null default false,
  timezone text not null default 'Africa/Cairo',
  share_code text not null unique,
  demo_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_patients_updated_at
  before update on public.patients
  for each row execute function set_updated_at();

-- 3. emergency_contacts
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  relationship text,
  phone text,
  email text,
  priority smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_phone_or_email check (phone is not null or email is not null)
);

create trigger tr_emergency_contacts_updated_at
  before update on public.emergency_contacts
  for each row execute function set_updated_at();

-- 4. care_links
create table public.care_links (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  caregiver_id uuid not null references public.profiles(id) on delete cascade,
  status link_status not null default 'pending',
  requested_code text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_care_links unique (patient_id, caregiver_id)
);

create trigger tr_care_links_updated_at
  before update on public.care_links
  for each row execute function set_updated_at();

-- 5. doctor_consents
create table public.doctor_consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  status consent_status not null default 'pending',
  requested_code text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_doctor_consents unique (patient_id, doctor_id)
);

create trigger tr_doctor_consents_updated_at
  before update on public.doctor_consents
  for each row execute function set_updated_at();

-- 6. doctor_consent_events
create table public.doctor_consent_events (
  id uuid primary key default gen_random_uuid(),
  consent_id uuid not null references public.doctor_consents(id) on delete cascade,
  status consent_status not null,
  created_at timestamptz not null default now()
);

-- 7. access_log
create table public.access_log (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewer_role user_role not null,
  resource text not null check (resource in ('patient_detail', 'report')),
  created_at timestamptz not null default now()
);

-- 8. medications
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  generic_name text,
  strength text,
  form med_form not null default 'tablet',
  color text not null default '#F5A524',
  dose_amount text not null,
  meal meal_rule not null default 'any',
  instructions text,
  start_date date not null default current_date,
  end_date date,
  is_active boolean not null default true,
  deleted_at timestamptz,
  source text not null default 'manual' check (source in ('manual', 'ai_prescription')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_medications_updated_at
  before update on public.medications
  for each row execute function set_updated_at();

-- 9. medication_schedules
create table public.medication_schedules (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade unique,
  times time[] not null,
  days_of_week smallint[] not null default '{0,1,2,3,4,5,6}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_medication_schedules_updated_at
  before update on public.medication_schedules
  for each row execute function set_updated_at();

-- 10. dose_logs
create table public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  scheduled_at timestamptz not null,
  status dose_status not null default 'scheduled',
  taken_at timestamptz,
  missed_at timestamptz,
  was_late boolean not null default false,
  confirmed_offline boolean not null default false,
  reminder_sent_at timestamptz,
  escalation_stage smallint not null default 0 check (escalation_stage between 0 and 4),
  escalation_next_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_dose_log_schedule unique (medication_id, scheduled_at)
);

create trigger tr_dose_logs_updated_at
  before update on public.dose_logs
  for each row execute function set_updated_at();

-- Indexes on dose_logs
create index idx_dose_logs_patient_scheduled on public.dose_logs (patient_id, scheduled_at);
create index idx_dose_logs_escalation on public.dose_logs (escalation_next_at)
  where status = 'missed' and escalation_stage < 4;
create index idx_dose_logs_scheduled on public.dose_logs (scheduled_at)
  where status = 'scheduled';

-- 11. alerts
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  dose_log_id uuid not null references public.dose_logs(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  kind alert_kind not null,
  channel alert_channel not null,
  recipient_user_id uuid references public.profiles(id) on delete set null,
  emergency_contact_id uuid references public.emergency_contacts(id) on delete set null,
  status alert_status not null default 'pending',
  attempts smallint not null default 0,
  last_error text,
  sent_at timestamptz,
  seen_at timestamptz,
  acknowledged_at timestamptz,
  token_hash text,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_alerts_updated_at
  before update on public.alerts
  for each row execute function set_updated_at();

-- Indexes on alerts
create index idx_alerts_pending on public.alerts (status) where status = 'pending';
create index idx_alerts_recipient_created on public.alerts (recipient_user_id, created_at desc);

-- 12. emergency_dispatch
create table public.emergency_dispatch (
  alert_id uuid primary key references public.alerts(id) on delete cascade,
  token_plain text not null,
  created_at timestamptz not null default now()
);

-- 13. push_subscriptions
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text,
  auth text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function set_updated_at();

-- 14. drug_catalog
create table public.drug_catalog (
  brand_name text primary key,
  generic_name text not null,
  notes text,
  created_at timestamptz not null default now()
);

-- 15. drug_info_cache
create table public.drug_info_cache (
  generic_name text primary key,
  label jsonb,
  ar_translation jsonb,
  source text,
  fetched_at timestamptz,
  created_at timestamptz not null default now()
);

-- 16. app_settings
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tr_app_settings_updated_at
  before update on public.app_settings
  for each row execute function set_updated_at();

-- ============================================================================
-- 5.7 ENABLE ROW LEVEL SECURITY ON EVERY TABLE
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.care_links enable row level security;
alter table public.doctor_consents enable row level security;
alter table public.doctor_consent_events enable row level security;
alter table public.access_log enable row level security;
alter table public.medications enable row level security;
alter table public.medication_schedules enable row level security;
alter table public.dose_logs enable row level security;
alter table public.alerts enable row level security;
alter table public.emergency_dispatch enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.drug_catalog enable row level security;
alter table public.drug_info_cache enable row level security;
alter table public.app_settings enable row level security;

-- Revoke all default privileges from anon on every table
revoke all on all tables in schema public from anon;
revoke all on table public.emergency_dispatch from authenticated;
