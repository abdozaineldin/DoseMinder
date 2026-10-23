-- Migration 00002: Triggers, RLS Helper Functions, and RLS Policies

-- ============================================================================
-- 5.3 TRIGGERS
-- ============================================================================

-- Function to generate share codes: DM-XXXXXX (6 chars from allowed set)
create or replace function public.generate_unique_share_code()
returns text as $$
declare
  chars text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  result text := 'DM-';
  i integer;
  candidate text;
  exists_code boolean;
begin
  loop
    result := 'DM-';
    for i in 1..6 loop
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    end loop;
    
    select exists (select 1 from public.patients where share_code = result) into exists_code;
    if not exists_code then
      return result;
    end if;
  end loop;
end;
$$ language plpgsql security definer set search_path = public;

-- handle_new_user trigger on auth.users insert
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
  if raw_role is null or raw_role not in ('patient', 'caregiver', 'doctor') then
    raise exception 'Invalid or missing user role: %', raw_role;
  end if;
  valid_role := raw_role::user_role;

  raw_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'User');
  raw_phone := new.raw_user_meta_data ->> 'phone';
  raw_specialty := new.raw_user_meta_data ->> 'specialty';
  raw_locale := coalesce(new.raw_user_meta_data ->> 'locale', 'ar');
  if raw_locale not in ('ar', 'en') then
    raw_locale := 'ar';
  end if;

  insert into public.profiles (
    id,
    role,
    full_name,
    phone,
    specialty,
    locale
  ) values (
    new.id,
    valid_role,
    raw_full_name,
    raw_phone,
    raw_specialty,
    raw_locale
  );

  if valid_role = 'patient' then
    insert into public.patients (
      id,
      share_code
    ) values (
      new.id,
      public.generate_unique_share_code()
    );
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- prevent_role_change trigger on profiles
create or replace function public.prevent_role_change()
returns trigger as $$
begin
  if new.role is distinct from old.role then
    raise exception 'Account role cannot be changed once registered.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger tr_profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- log_consent_event trigger on doctor_consents status change
create or replace function public.log_consent_event()
returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into public.doctor_consent_events (consent_id, status)
    values (new.id, new.status);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger tr_doctor_consents_log_event
  after insert or update on public.doctor_consents
  for each row execute function public.log_consent_event();

-- ============================================================================
-- 5.4 RLS HELPER FUNCTIONS
-- ============================================================================

create or replace function public.has_doctor_consent(p_patient uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.doctor_consents
    where patient_id = p_patient
      and doctor_id = auth.uid()
      and status = 'given'
  );
end;
$$ language plpgsql security definer stable set search_path = public;

create or replace function public.is_linked_caregiver(p_patient uuid)
returns boolean as $$
begin
  return exists (
    select 1
    from public.care_links
    where patient_id = p_patient
      and caregiver_id = auth.uid()
      and status = 'active'
  );
end;
$$ language plpgsql security definer stable set search_path = public;

-- Grant execute to authenticated users
grant execute on function public.has_doctor_consent(uuid) to authenticated;
grant execute on function public.is_linked_caregiver(uuid) to authenticated;

-- ============================================================================
-- 5.7 ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- 1. profiles
-- User can read and update their own profile (role is protected by trigger)
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Caregiver can select profile of patients with active link
create policy "profiles_select_caregiver_linked"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.care_links
      where patient_id = public.profiles.id
        and caregiver_id = auth.uid()
        and status = 'active'
    )
  );

-- Doctor can select profile of patients with consent given
create policy "profiles_select_doctor_consenting"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.doctor_consents
      where patient_id = public.profiles.id
        and doctor_id = auth.uid()
        and status = 'given'
    )
  );

-- Patient can see profile (name/specialty) of doctor/caregiver who requested access
create policy "profiles_select_patient_view_requesters"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.care_links
      where caregiver_id = public.profiles.id
        and patient_id = auth.uid()
    ) or
    exists (
      select 1 from public.doctor_consents
      where doctor_id = public.profiles.id
        and patient_id = auth.uid()
    )
  );

-- 2. patients
create policy "patients_select_own"
  on public.patients for select
  to authenticated
  using (id = auth.uid());

create policy "patients_update_own"
  on public.patients for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "patients_select_caregiver"
  on public.patients for select
  to authenticated
  using (public.is_linked_caregiver(id));

create policy "patients_select_doctor"
  on public.patients for select
  to authenticated
  using (public.has_doctor_consent(id));

-- 3. emergency_contacts
create policy "emergency_contacts_own_all"
  on public.emergency_contacts for all
  to authenticated
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

create policy "emergency_contacts_select_caregiver"
  on public.emergency_contacts for select
  to authenticated
  using (public.is_linked_caregiver(patient_id));

-- 4. care_links
create policy "care_links_select_patient"
  on public.care_links for select
  to authenticated
  using (patient_id = auth.uid());

create policy "care_links_select_caregiver"
  on public.care_links for select
  to authenticated
  using (caregiver_id = auth.uid());

-- 5. doctor_consents
create policy "doctor_consents_select_patient"
  on public.doctor_consents for select
  to authenticated
  using (patient_id = auth.uid());

create policy "doctor_consents_select_doctor"
  on public.doctor_consents for select
  to authenticated
  using (doctor_id = auth.uid());

-- 6. doctor_consent_events
create policy "doctor_consent_events_select_patient"
  on public.doctor_consent_events for select
  to authenticated
  using (
    exists (
      select 1 from public.doctor_consents
      where id = public.doctor_consent_events.consent_id
        and patient_id = auth.uid()
    )
  );

create policy "doctor_consent_events_select_doctor"
  on public.doctor_consent_events for select
  to authenticated
  using (
    exists (
      select 1 from public.doctor_consents
      where id = public.doctor_consent_events.consent_id
        and doctor_id = auth.uid()
    )
  );

-- 7. access_log
create policy "access_log_select_patient"
  on public.access_log for select
  to authenticated
  using (patient_id = auth.uid());

-- 8. medications
create policy "medications_select_own"
  on public.medications for select
  to authenticated
  using (patient_id = auth.uid());

create policy "medications_select_caregiver"
  on public.medications for select
  to authenticated
  using (public.is_linked_caregiver(patient_id));

create policy "medications_select_doctor"
  on public.medications for select
  to authenticated
  using (public.has_doctor_consent(patient_id));

create policy "medications_insert_own"
  on public.medications for insert
  to authenticated
  with check (patient_id = auth.uid());

create policy "medications_update_own"
  on public.medications for update
  to authenticated
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

create policy "medications_delete_own"
  on public.medications for delete
  to authenticated
  using (patient_id = auth.uid());

-- 9. medication_schedules
create policy "schedules_select_own"
  on public.medication_schedules for select
  to authenticated
  using (
    exists (
      select 1 from public.medications
      where id = public.medication_schedules.medication_id
        and patient_id = auth.uid()
    )
  );

create policy "schedules_select_caregiver"
  on public.medication_schedules for select
  to authenticated
  using (
    exists (
      select 1 from public.medications
      where id = public.medication_schedules.medication_id
        and public.is_linked_caregiver(patient_id)
    )
  );

create policy "schedules_select_doctor"
  on public.medication_schedules for select
  to authenticated
  using (
    exists (
      select 1 from public.medications
      where id = public.medication_schedules.medication_id
        and public.has_doctor_consent(patient_id)
    )
  );

create policy "schedules_all_own"
  on public.medication_schedules for all
  to authenticated
  using (
    exists (
      select 1 from public.medications
      where id = public.medication_schedules.medication_id
        and patient_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.medications
      where id = public.medication_schedules.medication_id
        and patient_id = auth.uid()
    )
  );

-- 10. dose_logs (SELECT only for users; NO direct insert/update/delete, RPC only)
create policy "dose_logs_select_own"
  on public.dose_logs for select
  to authenticated
  using (patient_id = auth.uid());

create policy "dose_logs_select_caregiver"
  on public.dose_logs for select
  to authenticated
  using (public.is_linked_caregiver(patient_id));

create policy "dose_logs_select_doctor"
  on public.dose_logs for select
  to authenticated
  using (public.has_doctor_consent(patient_id));

-- 11. alerts
create policy "alerts_select_patient"
  on public.alerts for select
  to authenticated
  using (patient_id = auth.uid());

create policy "alerts_select_caregiver"
  on public.alerts for select
  to authenticated
  using (recipient_user_id = auth.uid());

-- 12. push_subscriptions
create policy "push_subscriptions_all_owner"
  on public.push_subscriptions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 13. Public read-only tables for authenticated users
create policy "app_settings_read"
  on public.app_settings for select
  to authenticated
  using (true);

create policy "drug_catalog_read"
  on public.drug_catalog for select
  to authenticated
  using (true);

create policy "drug_info_cache_read"
  on public.drug_info_cache for select
  to authenticated
  using (true);
