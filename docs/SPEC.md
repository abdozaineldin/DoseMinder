# DoseMinder — MASTER BUILD SPECIFICATION (for the coding agent)

You are building **DoseMinder**, a production-quality web application, from scratch.
Everything you need is in this document. **Do not invent features, screens, tables, rules, numbers or copy that are not specified here.** If something is genuinely missing, make the smallest reasonable choice, write it down in `docs/DECISIONS.md`, and tell me at the end of the phase. Never silently deviate from this document.

---

## 0. HOW YOU MUST WORK

1. Work in **phases** (section 15). After each phase: run type-check, lint, build and any tests; fix everything; then write a short report (what was built, how to run it, what I must do manually, what is next) and **STOP and wait for me to say "continue"**. Do not start the next phase on your own.
2. Before writing code in Phase 0, save this entire document to `docs/SPEC.md` and keep it as the source of truth.
3. Use the **latest stable versions** of every tool. Versions change quickly: before using an API (Next.js, Supabase, Serwist, Tailwind, shadcn/ui, next-intl, Web Push library, Gemini SDK), **read its current official documentation** and follow it. Example: Next.js 16 renamed `middleware.ts` to `proxy.ts` — follow whatever the current docs say.
4. TypeScript **strict**. No `any` unless commented why. No dead code. No placeholder or mock data inside the UI: every screen reads real data from Supabase. Mock data exists **only** in the seed script (section 12).
5. Never put secrets in client code. The Supabase **service-role key** is used only in server-only code (Edge Functions, scripts). Everything else uses the anon key + Row Level Security.
6. Everything must work in **Arabic (RTL, default)** and **English (LTR)** with full text parity.
7. Accessibility and clarity for **elderly users** come first (big text, big buttons, high contrast, one main action per screen).
8. Write clean, modular, documented code (see section 14 for structure). Add a `README.md` with setup, env vars, commands, and the known limitations (section 16).

---

## 1. PRODUCT SUMMARY

**DoseMinder** is a medication management and patient-monitoring web app (installable PWA) for **elderly people**. It reminds patients to take medications, records taken/missed doses, notifies **caregivers** (family) when a dose is missed, escalates to **emergency contacts** if the patient (who may live alone) still doesn't confirm, and lets **doctors** monitor adherence **only with the patient's consent**. It supports **Arabic and English** and shows the saved schedule **offline**.

### 1.1 Actors
| Actor | Has account? | What they do |
|---|---|---|
| **Patient** | Yes | Manage profile & emergency contacts, manage medications/schedules, view medication info, receive reminders, confirm doses, view history, give/withdraw consent for doctors, switch language |
| **Caregiver** | Yes | Link to patients (patient approves), receive missed-dose alerts, view patient adherence dashboard |
| **Doctor** | Yes | Request access to patients (patient consents), view adherence reports only while consent is given |
| **Emergency Contact** | **No account** | Receives an emergency alert via a secure link (+ email). Can only view that alert page |
| **Database (Supabase)** | system | Stores everything, syncs offline changes |

### 1.2 Use cases (all must be implemented)
UC-1 Register · UC-2 Login · UC-3 Select Language · UC-4 Manage Patient Profile · UC-5 Manage Medication Schedule · UC-6 View Medication Information · UC-7 Receive Medication Reminder · UC-8 Confirm Dose Taken · UC-9 Track Missed Doses · UC-10 View Medication History · UC-11 Receive Missed-Dose Alert (caregiver) · UC-12 View Adherence Dashboard (caregiver) · UC-13 Access Patient Reports (doctor, consent-gated) · UC-14 Send Emergency Alert · UC-15 Sync Database Records · UC-16 Manage Doctor Consent.

### 1.3 Functional requirements (REQ-1 … REQ-17)
1. Register (patient/caregiver/doctor). 2. Login, error on wrong credentials. 3. Patient manages personal details + emergency contacts. 4. Patient adds/edits/deletes medications with dosages & schedules. 5. Display medication details. 6. Send reminder at each scheduled dose time. 7. Patient confirms dose taken → recorded in history. 8. Record dose as **missed** if not confirmed within the allowed time; store in history. 9. Patient views history of taken/missed doses. 10. Notify caregiver on missed dose. 11. Caregiver views adherence & missed doses. 12. Patient gives/withdraws consent for doctor. 13. Doctor monitors adherence **only while consent is given**. 14. Emergency alert to emergency contact when a missed dose stays unconfirmed after the follow-up alerts. 15. Arabic + English with switching. 16. Saved schedules & reminders accessible without internet. 17. Offline changes synchronize when internet returns.

### 1.4 Non-functional requirements (REQ-18 … REQ-27) — how you satisfy them
| REQ | Requirement | Implementation |
|---|---|---|
| 18 | Simple UI, large text/buttons, confirm dose in ≤ 3 taps | Section 9/10: patient "Taken" button reachable from Today in 1–2 taps; full-screen reminder = 1 tap |
| 19 | Schedules & reminders display within 2 s | Server components + indexed queries + IndexedDB cache; skeletons |
| 20 | ≥ 99 % reminders within 1 min of schedule, even when app closed | Server-side cron every minute + Web Push (needs internet). See limitation §16 |
| 21 | Auth + encryption in storage/transmission | Supabase Auth (hashed passwords), HTTPS/TLS, Supabase encryption at rest; document it in README |
| 22 | Prevent unauthorized access: caregiver only linked patients, doctor only consenting patients | **Row Level Security on every table** (section 5.7) + tests |
| 23 | Online services ≥ 99 % monthly availability | Vercel + Supabase hosting; health endpoint `/api/health` |
| 24 | Support mobile devices/OS, adapt to screen sizes | Mobile-first responsive PWA (Android Chrome, iOS Safari 16.4+ installed, desktop) |
| 25 | Modular build | Feature-based folders (section 14) |
| 26 | No loss/duplication on sync | Client-generated UUIDs + unique constraints + idempotent RPCs |
| 27 | Correct RTL/LTR | `dir` per locale, Tailwind logical properties, mirrored directional icons |

### 1.5 UI requirements (REQ-28 … REQ-41) — screens that must exist
28 Register (with role choice) + Login pages · 29 Patient home with today's schedule & dose status · 30 Page to add/edit/delete medications · 31 Medication details page · 32 Reminder screen with clear "Taken" button · 33 History page · 34 Profile page (details + emergency contacts) · 35 Caregiver dashboard · 36 Doctor page with reports of consenting patients · 37 Consent page for the patient · 38 Automatic alerts to caregiver & emergency contact (name, medication, scheduled time) · 39 Language switch with correct direction · 40 Offline/sync indicator · 41 Simple consistent navigation, high contrast, icons with labels.

---

## 2. TECH STACK (fixed — do not substitute)

**Frontend:** Next.js (App Router, latest stable) · React · TypeScript strict · Tailwind CSS (latest, CSS-variable theme tokens) · shadcn/ui (Radix) customised to our tokens · `lucide-react` icons · `next-intl` (i18n + RTL) · `motion` (Framer Motion) for animation · `react-hook-form` + `zod` · `date-fns` + `date-fns-tz` · `recharts` for charts · `dexie` (IndexedDB) for offline · **Serwist** for the service worker/PWA · `@supabase/ssr` + `@supabase/supabase-js`.
**Backend:** **Supabase** — Postgres, Auth (email + password), Row Level Security, Realtime, Edge Functions (Deno), `pg_cron` + `pg_net` (scheduling), Vault (secrets). Use **Supabase CLI migrations** in `supabase/migrations`, and generate TypeScript types with `supabase gen types`.
**Notifications:** Web Push (VAPID) from an Edge Function using a Deno-compatible library (e.g. `jsr:@negrel/webpush` — verify it works; otherwise another Deno-compatible one) · Email via **Resend** · In-app via Supabase Realtime.
**AI (prescription reading + translation only):** Google **Gemini** API called **server-side only** (Next.js route handlers). Model name from env `GEMINI_MODEL` (use a current vision-capable model).
**Drug information:** verified sources only — **RxNorm** (name normalisation) and **openFDA drug labels / DailyMed** (label text). Cached in `drug_info_cache`.
**Voice:** browser `speechSynthesis` (Web Speech API) — Arabic `ar-EG` → `ar-SA` → `ar` fallback; English `en-US`.
**Hosting:** Vercel (frontend), Supabase (backend). Time zone default **Africa/Cairo**.

---

## 3. PRODUCT RULES (BUSINESS LOGIC) — implement exactly

### 3.1 Roles & accounts
- Email + password via Supabase Auth. Role chosen **only at registration**: `patient | caregiver | doctor`. Role comes from the account afterwards (login has **no role picker**). The role can never be changed by the user.
- After login redirect: patient → `/patient/today`, caregiver → `/caregiver/family`, doctor → `/doctor/patients`. A user opening a route of another role is redirected to their own home.
- For development, email confirmation is OFF (document how to turn it on). Password min length 8.

### 3.2 Doses & the allowed time
- A medication has a schedule: times of day (local time of the patient's timezone), days of week.
- The system generates **dose rows** (`dose_logs`) with status `scheduled` for the **next 14 days**, extended daily.
- Defaults (stored in `app_settings`, configurable, **never hard-coded**):
  `allowed_minutes = 30` · `followup_count = 2` · `followup_interval_minutes = 15` · `emergency_delay_minutes = 15` · `early_window_minutes = 30` · `emergency_link_ttl_hours = 12`.
- **Reminder:** at `scheduled_at` the patient gets a push notification and the full-screen reminder is available.
- **Confirm:** the patient can confirm from `scheduled_at − early_window_minutes` onward. Confirm = status `taken`, `taken_at`.
- **Missed (UC-9):** if still `scheduled` at `scheduled_at + allowed_minutes` → status `missed`, `missed_at = now`.
- **Late confirmation:** the patient may still confirm a missed dose; it becomes `taken` with `was_late = true` (history shows "Late"), and **escalation stops**. Adherence counts it as taken.
- **No Snooze anywhere. Not in the UI, not in the DB.**

### 3.3 Escalation timeline (UC-11 → UC-14) — default values
```
T        scheduled time → reminder sent
T+30     not confirmed → dose = MISSED → stage 1: "missed" alert to every ACTIVE linked caregiver (push + in-app)
T+45     still unconfirmed → stage 2: follow-up alert #1 to caregivers
T+60     still unconfirmed → stage 3: follow-up alert #2 to caregivers
T+75     still unconfirmed → stage 4: EMERGENCY alert to the patient's emergency contacts (email + secure link)
```
(T+75 = last follow-up + `emergency_delay_minutes`.) All offsets derive from `app_settings`.
- If the patient confirms at any point → escalation stops immediately; caregivers get a short "confirmed" in-app notice if a missed alert was already sent.
- **No caregiver linked** (patient lives alone): skip caregiver stages (record alert rows with status `skipped_no_recipient`) but **still run stage 4** at the same time.
- **No emergency contact:** record an alert row `skipped_no_recipient` and send caregivers a notice "No emergency contact is saved for this patient".
- **Delivery failure:** mark alert `failed`, store `last_error`, retry up to 3 times with 1-minute spacing (UC-11 ext 2a, UC-14 ext 2a). Multiple emergency contacts → alert **each** one (UC-14 ext 2b).
- **Demo mode** (per patient, section 12): uses 1-minute values so the whole escalation can be shown in ~5 minutes.

### 3.4 Adherence
`adherence % = taken ÷ (taken + missed)` over doses whose `scheduled_at` is in the past (future & still-`scheduled` doses are excluded). Late-taken counts as taken. Display `—` when the denominator is 0. Colors: ≥ 85 % green, 60–84 % saffron, < 60 % coral.

### 3.5 Linking caregivers (UC-11/12)
- Every patient has a unique `share_code` (format `DM-XXXXXX`, 6 chars from `23456789ABCDEFGHJKMNPQRSTUVWXYZ`), shown on the patient's Privacy page with a copy button and a "regenerate code" button.
- A caregiver enters the code → creates a **pending** `care_links` row. The **patient approves or rejects**. Only `active` links give access. Patient or caregiver can revoke at any time.
- Rate-limit code attempts (max 10 per hour per user) inside the RPC. Never reveal whether a code exists beyond "Request sent" / "Code not valid".

### 3.6 Doctor consent (UC-13/16)
- A doctor enters the patient's code → creates a **pending** `doctor_consents` row. The doctor does **not** see the patient's identity until the patient gives consent.
- The patient sees the request (doctor's name, specialty) and chooses **Give consent** or **Reject**. Later the patient can **Withdraw**; withdrawal takes effect **immediately** (RLS reads the current status).
- Every decision is stored with date and time in `doctor_consent_events`.
- **Verify Patient Consent** is the RLS/RPC check `has_doctor_consent(patient_id)`: no consent → the doctor sees a "locked" state and **no data is returned**.
- Every time a caregiver or doctor opens a patient's detail/report, write a row in `access_log`. The patient sees "Who viewed my data" on the Privacy page.

### 3.7 Emergency contacts
- Not users. Fields: name, relationship, phone, email (at least one of phone/email required; warn if no email: "No automatic alert can be sent without an email"), priority.
- The emergency alert email contains a **secure link** `/e/{token}`: random 32-byte URL-safe token, **only its SHA-256 hash is stored**, expires after `emergency_link_ttl_hours`, `noindex`. The page shows only: patient name, medication, scheduled time, minutes overdue, the patient's medical ID (blood type, chronic conditions, allergies), patient phone, caregivers' phones, and buttons: **Call patient**, **Call caregiver**, **I checked — he is OK** (records `acknowledged_at`).

### 3.8 Medication information & AI (UC-6) — strict rules
- **AI only reads/extracts or translates. It never creates medical facts.**
- **Prescription reading:** patient uploads a photo (jpg/png/webp, ≤ 5 MB) or types a name. Gemini (temperature 0, JSON-schema output) extracts: `brand_name, generic_name, strength, form, dose_amount, frequency_text, suggested_times[], instructions, confidence`. Instruct it: *extract only what is visible; never infer doses; return `unreadable` when unclear.* The UI shows an **editable review table**; **nothing is saved until the patient confirms each row**. The image is **not stored** (processed in memory).
- **Drug info:** resolve brand → generic (seed `drug_catalog` with common Egyptian brands: Concor→bisoprolol, Janumet→sitagliptin+metformin, Plavix→clopidogrel, Augmentin→amoxicillin+clavulanate, Glucophage→metformin, Cardura→doxazosin, Norvasc→amlodipine, Lipitor→atorvastatin, Aspirin→acetylsalicylic acid, Panadol→paracetamol, Ventolin→salbutamol, Lasix→furosemide), then RxNorm normalisation, then openFDA label sections: *indications_and_usage, adverse_reactions, warnings (and boxed_warning), drug_interactions*. Show excerpts with source + fetch date. If `locale = ar`, show a Gemini **translation-only** summary of those excerpts, labelled "Machine translation of the official label — not medical advice".
- If no verified label is found → show "No verified information available for this medication" — **never** AI-generated medical content.
- Always show the disclaimer: AR `هذه المعلومات للتوعية فقط ولا تغني عن استشارة الطبيب أو الصيدلي.` / EN `This information is for awareness only and does not replace your doctor or pharmacist.`
- Rate-limit AI routes: 10 requests per hour per user.

### 3.9 Language & numerals
- Default `ar`. Switch anywhere (header + Settings), saved to `profiles.locale`. URL prefix `/ar` and `/en`.
- **Medication names, strengths and dose amounts always use Latin digits** (e.g. `08:00`, `500mg`). A user setting `numerals` (`latn` default | `arab`) affects only generic UI numbers (counts, percentages, dates).

---

## 4. DESIGN-LEVEL DECISIONS I ALREADY MADE (do not ask)
- No smartwatch feature. No Snooze. No login by code/phone. No SMS (provide a `NotificationChannel` interface so SMS can be added later). No medication stock/refill tracking. No admin panel.
- Late confirmation allowed (3.2). Escalation continues only until the dose is confirmed (caregiver "seen" does **not** stop it).

---

## 5. DATABASE (Supabase / Postgres) — exact specification

Create everything as **SQL migrations** in `supabase/migrations/` (numbered, re-runnable in order). Schema `public`. Timestamps are `timestamptz` (UTC). `id` columns are `uuid default gen_random_uuid()` unless noted. Every table has `created_at timestamptz not null default now()`, and `updated_at` (trigger `set_updated_at`) where mutable.

### 5.1 Enums
`user_role('patient','caregiver','doctor')` · `link_status('pending','active','rejected','revoked')` · `consent_status('pending','given','rejected','withdrawn')` · `dose_status('scheduled','taken','missed')` · `alert_kind('reminder','missed','followup_1','followup_2','emergency','confirmed_notice','no_emergency_contact_notice')` · `alert_channel('push','in_app','email')` · `alert_status('pending','sent','failed','skipped_no_recipient','seen','acknowledged')` · `med_form('tablet','capsule','syrup','injection','drops','cream','inhaler','other')` · `meal_rule('before','with','after','any')`.

### 5.2 Tables
**profiles** — `id uuid pk references auth.users on delete cascade`, `role user_role not null`, `full_name text not null`, `phone text`, `specialty text` (doctors), `locale text not null default 'ar' check in ('ar','en')`, `numerals text not null default 'latn' check in ('latn','arab')`, `font_scale smallint not null default 1 check between 1 and 3`, `high_contrast boolean not null default false`, `voice_enabled boolean not null default false`, `theme text not null default 'system' check in ('light','dark','system')`.
**patients** — `id uuid pk references profiles(id) on delete cascade`, `date_of_birth date`, `gender text check in ('male','female')`, `blood_type text check in ('A+','A-','B+','B-','AB+','AB-','O+','O-')`, `chronic_conditions text[] not null default '{}'`, `allergies text[] not null default '{}'`, `lives_alone boolean not null default false`, `timezone text not null default 'Africa/Cairo'`, `share_code text not null unique`, `demo_mode boolean not null default false`.
**emergency_contacts** — `patient_id uuid references patients(id) on delete cascade`, `name text not null`, `relationship text`, `phone text`, `email text`, `priority smallint not null default 1`, check `(phone is not null or email is not null)`.
**care_links** — `patient_id`, `caregiver_id` (→ profiles), `status link_status not null default 'pending'`, `requested_code text`, `responded_at timestamptz`, unique `(patient_id, caregiver_id)`.
**doctor_consents** — `patient_id`, `doctor_id`, `status consent_status not null default 'pending'`, `requested_code text`, `decided_at timestamptz`, unique `(patient_id, doctor_id)`.
**doctor_consent_events** — `consent_id references doctor_consents on delete cascade`, `status consent_status not null` (inserted by trigger on every status change; this is the dated history).
**access_log** — `patient_id`, `viewer_id`, `viewer_role user_role`, `resource text check in ('patient_detail','report')`.
**medications** — `id uuid pk` (**client may supply it** for offline creation), `patient_id`, `name text not null`, `generic_name text`, `strength text`, `form med_form not null default 'tablet'`, `color text not null default '#F5A524'`, `dose_amount text not null` (e.g. "1 tablet"), `meal meal_rule not null default 'any'`, `instructions text`, `start_date date not null default current_date`, `end_date date`, `is_active boolean not null default true`, `deleted_at timestamptz`, `source text not null default 'manual' check in ('manual','ai_prescription')`. **Delete = soft delete** (`is_active=false, deleted_at=now()`) so history is preserved.
**medication_schedules** — `medication_id references medications on delete cascade unique`, `times time[] not null` (local times, at least 1), `days_of_week smallint[] not null default '{0,1,2,3,4,5,6}'` (0=Sunday).
**dose_logs** — `id uuid pk` (client may supply), `patient_id`, `medication_id`, `scheduled_at timestamptz not null`, `status dose_status not null default 'scheduled'`, `taken_at timestamptz`, `missed_at timestamptz`, `was_late boolean not null default false`, `confirmed_offline boolean not null default false`, `reminder_sent_at timestamptz`, `escalation_stage smallint not null default 0` (0–4), `escalation_next_at timestamptz`, **unique `(medication_id, scheduled_at)`**. Indexes: `(patient_id, scheduled_at)`, partial `(escalation_next_at) where status='missed' and escalation_stage<4`, partial `(scheduled_at) where status='scheduled'`.
**alerts** — `dose_log_id`, `patient_id`, `kind alert_kind`, `channel alert_channel`, `recipient_user_id uuid` (caregiver), `emergency_contact_id uuid`, `status alert_status not null default 'pending'`, `attempts smallint not null default 0`, `last_error text`, `sent_at`, `seen_at`, `acknowledged_at`, `token_hash text`, `token_expires_at timestamptz`. Index on `(status)` where pending and on `(recipient_user_id, created_at desc)`.
**emergency_dispatch** — `alert_id uuid pk references alerts on delete cascade`, `token_plain text not null`. **RLS enabled with NO policies and all privileges revoked from `anon` and `authenticated`** (service role only). Row is deleted right after the email is sent.
**push_subscriptions** — `user_id`, `endpoint text not null unique`, `p256dh text`, `auth text`, `user_agent text`.
**drug_catalog** — `brand_name text pk`, `generic_name text not null`, `notes text` (seeded).
**drug_info_cache** — `generic_name text pk`, `label jsonb`, `ar_translation jsonb`, `source text`, `fetched_at timestamptz`.
**app_settings** — `key text pk`, `value jsonb not null` (seeded with the defaults in 3.2).

### 5.3 Triggers
- `handle_new_user` on `auth.users` insert: read `raw_user_meta_data` (`role`, `full_name`, `phone`, `specialty`, `locale`); **validate role ∈ the 3 allowed**; insert into `profiles`; if role = patient insert into `patients` with a generated unique `share_code`.
- `set_updated_at` on mutable tables. `log_consent_event` on `doctor_consents` status change. Prevent `profiles.role` update (raise exception).

### 5.4 Database functions (all `security definer`, `set search_path = public`, check `auth.uid()` inside; grant execute only to the roles that need them)
- `generate_doses(p_patient uuid, p_days int default 14)`: for each active medication + schedule, for each date in range matching `days_of_week` and between start/end date, for each time → `scheduled_at = (date + time) at time zone patient.timezone`; `insert … on conflict (medication_id, scheduled_at) do nothing`.
- `upsert_medication_with_schedule(p_id uuid, p_name, p_generic, p_strength, p_form, p_color, p_dose_amount, p_meal, p_instructions, p_start, p_end, p_times time[], p_days smallint[], p_updated_at timestamptz)`: transactional upsert; **last-write-wins by `updated_at`**; delete future `scheduled` doses of that medication and regenerate; never touch taken/missed.
- `delete_medication(p_id)`: soft delete, remove future `scheduled` doses.
- `confirm_dose(p_dose_id uuid, p_taken_at timestamptz, p_offline boolean default false)`: **idempotent**; caller must be the dose's patient; allowed if status `scheduled` and `now() >= scheduled_at − early_window`, or status `missed`; clamp `taken_at` to `[scheduled_at − early_window, now()]`; if it was missed set `was_late = true`; set `escalation_next_at = null`; if a missed alert had been sent, insert `confirmed_notice` alerts for caregivers. Re-confirming an already-taken dose returns success without changes.
- `get_adherence(p_patient uuid, p_from date, p_to date)` → `{taken, missed, total, percent, by_day[]}` (authorised by RLS-equivalent checks).
- `request_caregiver_link(p_code)`, `respond_care_link(p_id, p_accept)`, `revoke_care_link(p_id)`, `request_doctor_consent(p_code)`, `respond_doctor_consent(p_id, p_accept)`, `withdraw_doctor_consent(p_id)`, `regenerate_share_code()`, `log_access(p_patient, p_resource)`, `mark_alert_seen(p_id)`, `set_demo_mode(p_on)`, `create_demo_dose()` (inserts a dose for the patient's first active medication scheduled 1 minute from now; only if `demo_mode`).
- `has_doctor_consent(p_patient uuid) returns boolean` and `is_linked_caregiver(p_patient uuid) returns boolean` — `stable`, used by RLS.
- `get_emergency_alert(p_token text)` and `ack_emergency(p_token text)` — **callable by `anon`**; hash the token, check not expired; return only the minimal fields listed in 3.7. No other table is readable by `anon`.
- `run_tick()` — the heart of the system, called every minute by pg_cron:
  1. Reminders: for `scheduled` doses with `reminder_sent_at is null and scheduled_at <= now()` → insert one `alerts` row (`kind='reminder'`, `channel='push'`, `recipient_user_id = patient_id`, `status='pending'`) and set `reminder_sent_at = now()`.
  2. Missed: `update dose_logs set status='missed', missed_at=now(), escalation_stage=0, escalation_next_at=now()` where `status='scheduled' and scheduled_at + allowed <= now()` (use per-patient demo values if `demo_mode`).
  3. Escalate: for missed doses with `escalation_next_at <= now()` and `escalation_stage < 4`, **lock with `for update skip locked`**, create the alert rows for the next stage (stage 0→1 `missed`, 1→2 `followup_1`, 2→3 `followup_2` for each active caregiver with channels `in_app` + `push`; 3→4 `emergency` for each emergency contact with channel `email` and a fresh token — store only the hash), advance `escalation_stage` and set the next `escalation_next_at`.
  4. Return counts (for logging).
- `extend_dose_horizon()` — daily: `generate_doses` for all patients (14 days ahead) and purge expired emergency tokens.

### 5.5 Scheduling (pg_cron + pg_net)
- Job `tick` every minute: `select run_tick();` then `net.http_post` to the Edge Function `deliver-alerts` with an `Authorization` header read from **Vault**.
- Job `extend_horizon` daily at 00:05 Africa/Cairo (convert to UTC).
- Document in README how to enable the extensions and store the secrets.

### 5.6 Realtime
Enable Realtime on `alerts` and `dose_logs`. The client subscribes with the user's JWT, so RLS filters what each user receives.

### 5.7 Row Level Security — ENABLE ON **EVERY** TABLE. Revoke all default privileges from `anon`. Policies:
| Table | Patient (self) | Caregiver | Doctor | anon |
|---|---|---|---|---|
| profiles | select/update own (except `role`) | select profiles of patients with an `active` link; select profile of a patient who has a `pending` request from them is **not** allowed | select profiles of patients with consent `given`; patient can see a requester's name while pending | none |
| patients | select/update own | select where `is_linked_caregiver(id)` | select where `has_doctor_consent(id)` | none |
| emergency_contacts | full CRUD own | select where linked | none | none |
| medications, medication_schedules | full CRUD own (writes through RPC) | select where linked | select where consent | none |
| dose_logs | select own; **no direct insert/update/delete** (RPC only) | select where linked | select where consent | none |
| alerts | select where `patient_id = auth.uid()` | select where `recipient_user_id = auth.uid()` (update only via `mark_alert_seen`) | none | none |
| care_links | select own; respond via RPC | select/insert-through-RPC own | none | none |
| doctor_consents | select own; respond via RPC | none | select own | none |
| doctor_consent_events | select own | none | select own consents | none |
| access_log | select where `patient_id = auth.uid()` | insert via `log_access` only | insert via `log_access` only | none |
| push_subscriptions | owner full CRUD | owner | owner | none |
| app_settings, drug_catalog, drug_info_cache | read | read | read | none |

**Required:** write SQL tests (pgTAP or a TypeScript script run with real JWTs) proving: (a) a caregiver cannot read an unlinked patient; (b) a doctor cannot read a patient without `given` consent and **loses access immediately after withdrawal**; (c) a user cannot change their role; (d) a patient cannot insert/update `dose_logs` directly; (e) `anon` cannot read any table; (f) emergency token functions reject expired/unknown tokens; (g) re-running `confirm_dose` twice creates no duplicates.

---

## 6. EDGE FUNCTIONS & SERVER ROUTES

**Edge Function `deliver-alerts`** (service role; verifies the shared secret header):
1. `select … from alerts where status='pending' order by created_at for update skip locked limit 100`.
2. For each: `channel='push'` → send Web Push to the recipient's subscriptions (VAPID keys from secrets), remove expired subscriptions (410/404); `channel='in_app'` → mark `sent` (Realtime delivers the row); `channel='email'` → Resend email (AR/EN bilingual) containing the secure link `${APP_URL}/e/${token}`. **Token handling (final decision):** `run_tick()` generates the token with `gen_random_bytes(32)` (url-safe encoding), stores **only its SHA-256 hash** in `alerts.token_hash` (+ `token_expires_at`), and writes the raw token into `emergency_dispatch`. This function reads the raw token from `emergency_dispatch`, sends the email, then **deletes that row** whether the send succeeded or failed (on retry `run_tick`/the function issues a fresh token and replaces the hash).
3. Success → `status='sent', sent_at=now()`; failure → `attempts+1`, `last_error`; retry when `attempts < 3` after ≥ 1 minute; else `failed`.
4. Patient reminders: send push "Time for {medication} — {dose_amount}" to the patient with a deep link `/patient/reminder/{doseId}`.

**Next.js route handlers (server only, authenticated, rate-limited):**
- `POST /api/ai/prescription` (multipart image **or** JSON `{ name }`) → structured JSON per 3.8.
- `GET /api/drug-info?name=` → catalog → RxNorm → openFDA → cache → optional Arabic translation.
- `POST /api/push/subscribe` and `DELETE /api/push/subscribe`.
- `GET /api/health` → `{ ok: true }`.

---

## 7. NOTIFICATIONS & REALTIME (client behaviour)
- Ask for notification permission **only** after the user taps "Enable reminders" (Settings and the first-run card), never on page load. Show the permission status in Settings.
- On Android/desktop show an install prompt (`beforeinstallprompt`). On iOS show a guide card "Add to Home Screen to receive reminders" (Web Push on iOS requires the installed PWA).
- Caregiver: subscribe to Realtime `alerts`; show a toast + sound (user-mutable) and update the bell badge; list in `/caregiver/alerts`; "Seen" button → `mark_alert_seen` (**does not stop escalation**).
- Patient: while the app is open, an in-page timer opens the reminder screen at `scheduled_at` even if the push did not arrive (also works offline for already-loaded schedules).

---

## 8. OFFLINE, PWA & SYNC (UC-15, REQ-16/17/26)
- **Serwist** service worker: precache the app shell; runtime-cache GET navigations/data for today's patient screens (stale-while-revalidate); push event handler shows the notification and handles `notificationclick` (open `/patient/reminder/{id}`). Web manifest (name DoseMinder, `display: standalone`, theme `#0F6B70`, background `#FAF7F2`, icons 192/512/maskable, RTL aware).
- **Dexie database `doseminder`:** tables `profile`, `medications`, `schedules`, `doses` (window: −7…+7 days), `outbox`, `meta`.
- **Read path:** screens read from Dexie first (instant), then refresh from Supabase and write back.
- **Write path / outbox:** every mutation made offline is appended to `outbox` `{ id (uuid), type: 'confirm_dose'|'upsert_medication'|'delete_medication', payload, createdAt, attempts }` and applied optimistically to Dexie. The **sync engine** flushes the outbox in order when: the app starts, the `online` event fires, every 60 s while online, and after each mutation. It calls the idempotent RPCs from 5.4. On success remove the item; on a transient error back off; on a permanent error (e.g. validation) move it to a "needs attention" list and show it in the sync pill.
- **Conflict rules:** `confirm_dose` always wins over `missed`; medications use last-write-wins by `updated_at`; deletes are soft.
- **Sync indicator (REQ-40):** `ConnectionPill` in the header — states: `Online · Synced`, `Offline · N changes waiting`, `Syncing…`, `Sync problem` (tap for details).
- Offline: the Today screen, medication list, medication details (already viewed), history (last 30 days cached) must work. Login pages require a connection.
- Honest limitation (README + Settings text): *Time-based push notifications need an internet connection. When offline, reminders are shown only while the app is open.* Do **not** claim true background offline reminders.

---

## 9. DESIGN SYSTEM

**Concept:** *"Warm clinical calm"* — warm paper backgrounds, deep teal as the trust colour, saffron for attention, clear status colours. Calm, large, uncluttered, never childish.

### 9.1 Color tokens (define as CSS variables in the Tailwind theme; map shadcn tokens to them)
Light:
```
--ink:#0E2A2C  --primary:#0F6B70  --primary-dark:#0A4B4F  --primary-tint:#E3F3F1
--paper:#FAF7F2  --card:#FFFFFF  --sand:#F1EBDF  --line:#E5DDD0
--saffron:#F5A524  --saffron-tint:#FFF1D6
--taken:#1E8E55  --taken-tint:#DDF3E6
--missed:#D9453D  --missed-tint:#FDE3E0
--emergency:#A3141B  --emergency-tint:#FBE9EA
--muted:#5B6F71   (secondary text)
```
Dark:
```
--ink:#EAF3F2  --primary:#4FC3C0  --primary-dark:#2E9E9B  --primary-tint:#12383B
--paper:#0A1A1C  --card:#12292C  --sand:#173337  --line:#1F3B3F
--saffron:#F5B84A  --saffron-tint:#3A2E12
--taken:#3DBB7A  --taken-tint:#12362A
--missed:#F0716A  --missed-tint:#3B1A19
--emergency:#E04B52  --emergency-tint:#3A1517  --muted:#9DB4B5
```
Rules: **saffron is used as a fill with dark ink text, never as text on white**. Every status is expressed by **colour + icon + text** (never colour alone). Minimum contrast WCAG AA (verify), patient screens aim for AAA on main text. High-contrast mode: ink `#000`/`#fff`, 2px borders, no translucent surfaces.
Time-of-day header gradients (patient Today header only, computed from the patient's local time):
dawn 04:30–08:00 `linear-gradient(180deg,#FFE9D2,#FAF7F2)` · day 08:00–16:30 `linear-gradient(180deg,#E3F3F1,#FAF7F2)` · evening 16:30–19:30 `linear-gradient(180deg,#FFD9B0,#FBE4E0 55%,#FAF7F2)` · night 19:30–04:30 `linear-gradient(180deg,#0F3B3F,#12292C)` with light text.

### 9.2 Typography
`next/font/google`: **Readex Pro** (headings, weights 500/600/700) and **IBM Plex Sans Arabic** (body, 400/500/600), both with `arabic` + `latin` subsets, `display: swap`. Root size: patient area `18px`, caregiver/doctor `16px`. **Font scale setting** (profiles.font_scale 1/2/3 → root ×1 / ×1.2 / ×1.4). Headings: display 36/44, h1 28/36, h2 22/30, body 18/28 (patient) or 16/24, caption 14/20. Use `font-variant-numeric: lining-nums tabular-nums` for times and numbers.

### 9.3 Shape, elevation, motion, icons
Radius: patient area 24 px cards / 16 px controls / full pills; caregiver & doctor 12 px. Shadows (2 layers): `0 1px 2px rgba(14,42,44,.06), 0 8px 24px rgba(14,42,44,.08)`. Focus ring: 3 px `--primary` with 2 px offset. Min touch target **48 px** (patient **56 px**, main "Taken" button **64 px** high, full width up to 420 px). Icons: `lucide-react` only (no emoji); directional icons mirror in RTL. Illustrations: our own SVGs (pills, pulse line, heart), no stock photos. Motion: 150–250 ms ease-out; animate with `motion`; **respect `prefers-reduced-motion`** (replace with instant/fade).
Logo: wordmark "DoseMinder" where the **o is a capsule**, followed by a small pulse line; heart-pulse favicon.

### 9.4 Signature components (build once, reuse)
1. **DoseRing** (SVG): N arc segments (one per dose today) with small gaps; each segment coloured by status (taken green / due saffron with pulse / upcoming line colour / missed coral); centre shows `taken of total` ("1 من 3" / "1 of 3"). Segments fill with a 400 ms sweep when a dose is confirmed.
2. **PillIcon** (SVG) props `form`, `color`, `size`: tablet (round, score line), capsule (two-tone), syrup (bottle + cap), injection (syringe), drops (dropper), cream (tube), inhaler, other.
3. **BigTakenButton**: states `idle → pressing → success (check draws, 3 soft pulses, haptic via `navigator.vibrate` if available) → done`; and `queued-offline` (small clock badge "Saved, will sync"). Disabled before the early window with the helper text "Available from {time}".
4. **AllowedTimeRing**: countdown ring on the reminder screen showing the time left until the dose becomes "missed" (`mm:ss`, starts at `allowed_minutes`), turns coral in the last 5 minutes.
5. **StatusChip**: `Taken` (green, check), `Due now` (saffron, clock, pulse), `Upcoming` (muted, circle), `Missed` (coral, alert), `Late` (saffron-outline, check).
6. **EscalationStepper**: vertical (mobile) / horizontal (desktop) steps `Reminder → Missed → Caregiver alerted → Follow-up 1 → Follow-up 2 → Emergency contact alerted`, each with a real timestamp from `alerts`, current step highlighted, future steps muted, skipped steps shown "skipped — no recipient".
7. **AdherenceHeatmap**: last 30 days grid; cell colour = day's adherence (green ≥ 85, saffron 60–84, coral < 60, line = no doses); tooltip with date + `x of y`; accessible table fallback for screen readers.
8. **TrendSparkline** (recharts): 30-day adherence line, no axes, used in the doctor table.
9. **ConnectionPill** (section 8), **TimeOfDayHeader**, **EmptyState** (SVG + one sentence + one button), **ConfirmDialog**, **Skeleton** loaders for every list/card, **Toast** system.
10. **LocaleSwitcher**, **FontScaleControl** (A / A+ / A++), **ThemeToggle**.

### 9.5 i18n / RTL rules
`next-intl`, routes `/[locale]/…`, `dir="rtl"` for `ar`. Use Tailwind **logical** utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`). Two complete message files `messages/ar.json` and `messages/en.json` with identical keys (add a script that fails the build if keys differ). Dates/times via `Intl.DateTimeFormat` with the patient's timezone; Arabic uses Gregorian by default.

### 9.6 Accessibility
Semantic landmarks, visible focus, full keyboard use, ARIA labels on icon-only buttons (every icon button also has a visible label on the patient area), live regions for toasts/alerts, no information by colour alone, `lang` + `dir` set on `<html>`, form errors tied to inputs. **Simple mode** (patient setting): Today screen only + bottom nav reduced to Today / Medications / Me.

---

## 10. SCREENS — exact specification

Layouts: **Public** (marketing + auth) · **Patient shell**: mobile-first, header (logo, ConnectionPill, LocaleSwitcher) + **bottom nav with 4 large tabs: Today · Medications · History · Me** (icon + label); on ≥ 1024 px the nav becomes a left/right sidebar (side follows direction) and content is a centred column max 720 px · **Caregiver shell** and **Doctor shell**: sidebar (collapses to a drawer on mobile) + top bar.

### 10.1 Landing `/[locale]`
Sticky header (logo, links: How it works, Features, Language switch, "Log in" outline, "Get started" primary). Sections in order:
1. **Hero:** H1 AR `دواؤك في ميعاده... وأهلك مطمئنين` / EN `Your medicine on time... and your family at ease`. Sub AR `تطبيق ذكي يذكّرك بمواعيد أدويتك، ويطمّن أهلك وطبيبك عليك، ويعرض جدولك حتى بدون إنترنت.` / EN `A smart app that reminds you to take your medication, keeps your family and doctor reassured, and shows your schedule even offline.` CTAs: **Get started** (→ register), **Log in**. Right/left side: a **phone mockup built in HTML/SVG** (not an image) showing a live animated DoseRing + next-dose card. Warm background shapes (soft pill/pulse SVG), no stock photo.
2. **Three role cards** (Patient / Family / Doctor): icon, one-line benefit, button → `/register?role=patient|caregiver|doctor`.
3. **How it works** (3 numbered steps): 1 Add your medications (type or photo of the prescription) · 2 Get reminded at the right time · 3 Family and doctor stay informed.
4. **Escalation strip** (animated on scroll): `Dose time → Not confirmed in 30 min → Family alerted → Two follow-ups every 15 min → Emergency contact alerted` — AR `موعد الجرعة ← لم تُؤكَّد خلال 30 دقيقة ← تنبيه الأسرة ← تنبيهان للمتابعة كل 15 دقيقة ← تنبيه جهة الطوارئ`.
5. **Features grid (4–6 cards):** Arabic & English (RTL) · Your schedule offline · Voice reminders · Privacy by your consent · Large, simple screens · Install on your phone.
6. **Footer:** logo, tagline, links, `© {current year} DoseMinder` (computed, never hard-coded).

### 10.2 Auth `/[locale]/login`, `/register`, `/forgot-password`, `/reset-password`
Split screen (≥ 1024 px): one side deep-teal panel (`--primary-dark` gradient) with the wordmark, tagline AR `بداية رحلة صحية رائعة` and an animated pulse line; other side the form card. Mobile: form only with a small teal header.
- **Login:** email, password (show/hide), "Forgot password?", submit. Wrong credentials → inline error `AR: البريد أو كلمة المرور غير صحيحة` (UC-2). Link to register.
- **Register:** step 1 choose role (3 large selectable cards with icon + description; pre-selected from `?role=`), step 2 form: full name, email, password (strength hint), phone (optional), specialty (doctor only), language preference. Duplicate email → friendly error and link to login (UC-1 ext 3b). On success → role home.
- **Forgot/Reset:** Supabase email reset flow.

### 10.3 Patient `/patient/...`
**Today `/patient/today`** — `TimeOfDayHeader` (greeting by time: AR `صباح الخير/مساء الخير, {name}`, date, ConnectionPill) · **NextDoseCard** (PillIcon, medication name + strength in Latin digits, dose amount, meal rule text e.g. "with dinner", relative time "in 25 min" / "Due now", **BigTakenButton**, secondary **Listen** button (TTS reads name, dose, instructions in the current language)) · **DoseRing** + "x of y today" · **Today timeline** (all today's doses sorted, each with StatusChip, time, medication, tap → reminder screen or details) · **Medical ID card** (blood type, chronic conditions, allergies, lives alone) with quick **Call** buttons (caregiver, doctor with consent, first emergency contact) using `tel:` links · first-run cards: "Enable reminders", "Install app", "Add your first medication" when empty. When nothing is due: calm message "All done for now" + next dose time. When a dose is missed today: coral banner with "Confirm now" (late confirmation).
**Reminder `/patient/reminder/[doseId]`** (also the push deep link) — full-screen focus view: very large PillIcon, medication name, strength, dose amount, meal rule + instructions, **AllowedTimeRing**, **BigTakenButton**, Listen button (auto-speaks once if `voice_enabled`). After success: success animation then back to Today. If already taken: shows "Already recorded at {time}". No snooze.
**Medications `/patient/medications`** — list of cards (PillIcon in chosen colour, name, strength, dose amount, time chips, days, source badge "From prescription"), **Add medication** floating/primary button. Empty state with SVG.
**Add/Edit `/patient/medications/new`, `/[id]/edit`** — 3-step wizard, large inputs: **Step 1 Identify** — type a name (autocomplete from `drug_catalog`) **or** "Scan prescription" (camera/file) → AI review table (editable, per-row confirm checkbox, confidence badge, "unreadable" rows highlighted) → choose rows to import; **Step 2 Dose & times** — strength, form (icon picker), colour (8 swatches), dose amount, meal rule, frequency presets (Once daily · Twice daily · Three times · Every X hours from {time} · Specific days) which expand into an editable list of times (big time pickers) + days-of-week toggles, start/end date; **Step 3 Review & save**. Validation with zod; errors under fields (UC-5 ext 3a). Save → `upsert_medication_with_schedule`; works offline via outbox (shows "Saved on this device — will sync"). **Delete** (in edit) → ConfirmDialog → soft delete (UC-5 ext 1b).
**Details `/patient/medications/[id]`** — header with PillIcon, name, strength; the patient's own schedule & instructions; **Information** section from `/api/drug-info` (purpose, side effects, warnings with source + date, Arabic translation block when `ar`, disclaimer); loading skeleton; "No verified information available" fallback. Cached copy shown offline.
**History `/patient/history`** — month calendar (cells coloured by day adherence; tap a day → list), weekly adherence % card with `DoseRing`-style gauge, filter chips (All / Taken / Missed / Late), grouped list by day with medication, scheduled time, status, taken time. Pagination/infinite scroll. Last 30 days cached for offline.
**Me `/patient/me`** — menu list: Personal details · Medical ID · Emergency contacts · Privacy & sharing · Settings · Log out.
**Profile `/patient/me/profile`** — full name, phone, date of birth, gender, blood type, chronic conditions (tag input), allergies (tag input), lives alone (switch). Save → toast.
**Emergency contacts `/patient/me/emergency-contacts`** — list with priority order (drag or up/down buttons), add/edit/delete; validation phone/email rule; warning chip when no email.
**Privacy & sharing `/patient/me/privacy`** — (1) **My share code** with copy/regenerate; (2) **Family & caregivers**: pending requests (Approve / Reject), active list (Revoke); (3) **Doctors**: pending requests with doctor name/specialty (**Give consent / Reject**), active consents with a switch **"Allow my doctor to monitor my adherence"** (turn off = withdraw, confirm dialog, immediate), history of decisions with dates; (4) **Who viewed my data** (from `access_log`: who, role, what, when).
**Settings `/patient/me/settings`** — language, theme, font size (A / A+ / A++ live preview), high contrast, voice reminders on/off + test button, numerals, notifications (permission status + enable button + install guide), simple mode, **Demo mode** (switch + "Create a test dose due in 1 minute" button; shows the explanatory text "Uses 1-minute timings for presentations"), offline limitation note (section 8), log out.

### 10.4 Caregiver `/caregiver/...`
Sidebar: **My family · Alerts · Settings**.
**My family `/caregiver/family`** — "Add a patient" (enter code → pending state card "Waiting for approval"). One card per active patient: avatar (initial), name, age, **DoseRing for today**, status chip (`All good` green / `Missed dose` coral / `Emergency` crimson), next dose + time, last confirmation time, adherence %. Realtime updates.
**Patient detail `/caregiver/family/[patientId]`** (writes `access_log`) — header with name, call + WhatsApp buttons (`tel:` / `https://wa.me/`), today's timeline, **EscalationStepper** for the latest missed dose, 30-day **AdherenceHeatmap**, adherence %, list of missed doses (date, medication, status, late?), medication list (read-only), medical ID, alert history.
**Alerts `/caregiver/alerts`** — realtime list (kind icon, patient, medication, scheduled time, how long ago, status), unread highlight, **Seen** button; filters (All/Unseen/Missed/Emergency). Toast + optional sound for new alerts.
**Settings** — language, theme, notifications enable, alert sound, log out.

### 10.5 Doctor `/doctor/...`
Sidebar: **Patients · Settings**.
**Patients `/doctor/patients`** — stat tiles (Patients with consent · Average adherence · Need attention); **Add patient** (enter code → "Request sent, waiting for the patient's consent"); search + sort + filter (All / Needs attention / Good); table columns: Patient (name, age) · Conditions · Adherence % with bar + **TrendSparkline** · Status chip · Actions (View report). *Needs attention* = adherence < 60 % or ≥ 2 consecutive missed doses (show a warning icon). Pending requests listed separately as "Pending (code DM-XXXXXX)". Only consenting patients appear with identity.
**Report `/doctor/patients/[patientId]`** (writes `access_log`; **calls `has_doctor_consent`**) — period selector (7 / 30 / 90 days); header with patient summary (age, blood type, conditions, allergies); adherence line chart; AdherenceHeatmap; stats (taken / missed / late / adherence); missed-doses table; medication list with schedules; **Print / Save PDF** button (print stylesheet). **Locked state** when consent is missing or withdrawn: lock illustration + `AR: سحب المريض موافقته على عرض بياناته` / EN `The patient has not given or has withdrawn consent` and no data in the page source.

### 10.6 Emergency page (public, no account) `/e/[token]`
Full-bleed `--emergency` background, white card, large alert icon. Content (from `get_emergency_alert`): "Emergency — {patient name} has not confirmed {medication} ({dose}) due at {time}", "overdue by {n} minutes", medical ID block, buttons **Call patient**, **Call caregiver** (each caregiver), **I checked — he is OK** (calls `ack_emergency`, shows "Thank you" state). Expired/invalid token → neutral page "This link is no longer valid". AR default with language toggle; `noindex`, no analytics, no navigation to the rest of the app.

### 10.7 Global states
Skeletons while loading; friendly error boundaries with "Try again"; offline banner; 404 page; toasts for success/error; every destructive action uses ConfirmDialog.

---

## 11. COPY DECK (canonical wording — add the rest in the same simple tone, both languages)
| Key | AR | EN |
|---|---|---|
| taken_button | أخذت الجرعة | I took it |
| listen | اسمع التذكير | Listen |
| due_now | حان موعدها | Due now |
| upcoming | قادمة | Upcoming |
| missed | فايتة | Missed |
| late | متأخرة | Late |
| all_done | خلصت جرعات الآن | All done for now |
| all_good | كله تمام | All good |
| missed_dose_alert_title | جرعة فايتة | Missed dose |
| emergency_title | حالة طوارئ | Emergency |
| consent_give | أوافق | Give consent |
| consent_withdraw | سحب الموافقة | Withdraw consent |
| consent_locked | سحب المريض موافقته على عرض بياناته | Consent not given or withdrawn |
| offline_pending | غير متصل · {n} تغييرات في الانتظار | Offline · {n} changes waiting |
| synced | متصل · تمت المزامنة | Online · Synced |
| disclaimer | هذه المعلومات للتوعية فقط ولا تغني عن استشارة الطبيب أو الصيدلي. | This information is for awareness only and does not replace your doctor or pharmacist. |
| no_drug_info | لا توجد معلومات موثّقة لهذا الدواء | No verified information available for this medication |
| saved_offline | تم الحفظ على جهازك وسيتم رفعه عند عودة الإنترنت | Saved on this device — will sync when you're online |
| offline_limitation | التذكيرات المعتمدة على الوقت تحتاج إنترنت. أثناء انقطاع الإنترنت تظهر التذكيرات فقط والتطبيق مفتوح. | Time-based push reminders need internet. Offline, reminders appear only while the app is open. |

---

## 12. SEED & DEMO DATA (`scripts/seed.ts`, service role, refuses to run when `NODE_ENV=production` or `ALLOW_SEED` ≠ `true`)
Create via the Supabase Admin API (password for all demo users `Demo@12345`):
- **Patient 1** `patient@demo.dm` — الحاج محمد أحمد, 68, blood O+, chronic: ارتفاع ضغط الدم / السكري النوع الثاني, allergy: Penicillin, lives alone = true. Medications: Concor 5mg (bisoprolol) 08:00 daily; Janumet 50/1000mg 08:00 & 20:00 with meal; Plavix 75mg 20:00. **30 days of history** with ≈ 87 % adherence (mix of taken, a few late, a few missed). Emergency contacts: ابنته نورا (email + phone), شقيقه (phone only).
- **Patient 2** `patient2@demo.dm` — الحاجة فاطمة الزهراء, 62, chronic: ارتفاع ضغط الدم المزمن, ≈ 60 % adherence history, lives with family.
- **Caregiver** `caregiver@demo.dm` — سارة محمد, **active** link to Patient 1.
- **Doctor** `doctor@demo.dm` — د. إلهام بدران (specialty: Internal Medicine): consent **given** for Patient 1, **pending** for Patient 2.
- Seed `drug_catalog`, `app_settings`, and `drug_info_cache` with 3 pre-fetched labels so the demo never depends on external APIs.
- **Demo mode flow** (for the presentation): Patient Settings → Demo mode ON → "Create a test dose due in 1 minute" → within ~5 minutes the audience sees: reminder → missed → caregiver alert (realtime on the caregiver's screen) → two follow-ups → emergency email/link — with the EscalationStepper filling live.

---

## 13. SECURITY & PRIVACY CHECKLIST (must pass before the final phase)
- RLS enabled and tested on all tables; `anon` has no table access; service-role key only in server-only code and Edge Functions.
- All RPCs validate `auth.uid()` and roles; `security definer` functions set `search_path`.
- Security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` allowing camera/microphone only on needed pages), `noindex` on `/e/*`, httpOnly cookie sessions via `@supabase/ssr`.
- Input validation with zod on every form and route handler; image upload type/size checked; AI/drug-info routes rate-limited; prompts never include other users' data.
- Prescription images never stored; logs never contain medical data or tokens.
- Emergency tokens: 32 random bytes, hash stored, TTL enforced, single purpose.
- `.env.example` documents every variable; no secrets committed.
- Document in README: TLS in transit, Supabase encryption at rest, password hashing by Supabase Auth (this is how REQ-21 is met).

---

## 14. PROJECT STRUCTURE, CONVENTIONS & ENV

```
/
├─ docs/ (SPEC.md, DECISIONS.md)
├─ messages/ (ar.json, en.json)
├─ public/ (icons, manifest assets)
├─ scripts/ (seed.ts, check-i18n.ts)
├─ supabase/ (migrations/, functions/deliver-alerts/, tests/, config.toml, seed data)
├─ src/
│  ├─ app/[locale]/(marketing)|(auth)|(patient)|(caregiver)|(doctor)/…
│  ├─ app/e/[token]/ · app/api/(ai|drug-info|push|health)/…
│  ├─ components/ui/ (shadcn)  · components/shared/ (DoseRing, PillIcon, …)
│  ├─ features/ (auth, medications, doses, alerts, family, consent, reports, settings, offline)
│  ├─ lib/ (supabase clients, i18n, time, adherence, push, drug-info, ai)
│  ├─ db/ (generated types) · sw.ts (Serwist)
```
Env (`.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `RESEND_API_KEY`, `EMAIL_FROM`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `APP_URL`, `CRON_SHARED_SECRET`, `ALLOW_SEED`.
Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `db:types`, `db:reset`, `seed`, `i18n:check`.

---

## 15. PHASES (stop after each one and report)

**Phase 0 — Foundations.** Next.js + TS + Tailwind + shadcn + next-intl (ar/en, RTL) + fonts + design tokens (light/dark) + base layouts + core shared components (Button, Card, Input, Dialog, Toast, Skeleton, EmptyState, LocaleSwitcher, ThemeToggle, FontScaleControl) + `docs/SPEC.md` + README skeleton + CI scripts + i18n key check. Supabase project wiring + `.env.example`. **Accept:** `build` passes; a `/ar` and `/en` style-guide page shows all tokens/components in light & dark and RTL/LTR. Report the **manual steps** I must do in Supabase/Vercel.
**Phase 1 — Database & security.** All migrations (5.1–5.6), RLS (5.7), functions, triggers, seeds of settings/catalog, generated types, the RLS test suite. **Accept:** all tests in 5.7 pass.
**Phase 2 — Auth, roles, landing.** Landing page (10.1), auth pages (10.2), role redirects, route protection, profile bootstrap, shells and navigation for the three roles. **Accept:** UC-1, UC-2, UC-3 work end-to-end.
**Phase 3 — Patient core.** Profile, medical ID, emergency contacts, medications wizard (manual entry first), schedules → dose generation, Today screen, reminder screen (in-page), confirm flow, history. **Accept:** UC-4, 5, 7 (in-page), 8, 10 work with real data.
**Phase 4 — Reminders & missed doses.** `run_tick`, pg_cron job, `deliver-alerts` Edge Function, Web Push subscribe + service worker push handling, patient push reminders, missed marking, late confirmation. **Accept:** a dose becomes missed automatically; push reminder arrives.
**Phase 5 — Caregiver.** Linking by code + approval, family dashboard, patient detail, alerts (Realtime), EscalationStepper, heatmap. **Accept:** UC-11, 12.
**Phase 6 — Consent & doctor.** Doctor requests, patient consent management, access log, doctor patients list + report + locked state. **Accept:** UC-13, 16; consent withdrawal removes access immediately (tested).
**Phase 7 — Emergency.** Stage 3→4 escalation, emergency contacts email via Resend, secure link page, acknowledgment, no-recipient rules, retries. **Accept:** UC-14 with the demo flow.
**Phase 8 — Offline/PWA/Sync.** Manifest, Serwist, Dexie, outbox, sync engine, ConnectionPill, install prompts. **Accept:** UC-15; offline Today/medications/history; offline confirmation syncs without duplicates.
**Phase 9 — AI, drug info, voice.** Prescription reading + review table, drug info with cache and translation, TTS. **Accept:** UC-6 with verified sources only.
**Phase 10 — Polish & proof.** Seed script, demo mode, accessibility audit (axe/Lighthouse ≥ 95 a11y), performance (schedule screens < 2 s on a throttled mobile profile), security checklist (section 13), README (setup, env, commands, deploy to Vercel, known limitations), requirement-traceability table `docs/TRACEABILITY.md` mapping every REQ-1…41 and UC-1…16 to files/screens. **Accept:** full demo script runs end to end.

---

## 16. OUT OF SCOPE & KNOWN LIMITATIONS (write them in the README)
- No native mobile app. **Time-based reminders need internet (Web Push); offline, reminders appear only while the app is open.** A native app is future work.
- No SMS (interface prepared), no smartwatch, no Snooze, no refill tracking, no admin panel, no payments.
- Drug labels come from US sources (openFDA/DailyMed); Egyptian brand coverage depends on `drug_catalog`.
- The app is an aid, **not** a medical device or medical advice.

---

## 17. WHAT I (THE USER) MUST DO MANUALLY — list these at the end of Phase 0 and keep updating
Create the Supabase project; enable `pg_cron` and `pg_net`; copy URL/keys to `.env.local`; create the Resend, Gemini and VAPID credentials (give me the exact commands to generate VAPID keys); store secrets in Supabase Vault / Edge Function secrets; create the Vercel project and set env vars; run `supabase db push`, `supabase functions deploy deliver-alerts`.

**Start with Phase 0 now. Remember: build only Phase 0, report, and wait for "continue".**
