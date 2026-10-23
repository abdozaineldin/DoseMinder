# DECISIONS

Deviations from `docs/SPEC.md` and small choices made where the spec was silent.

## D-001: Missing `role` in signup metadata defaults to `patient` (deviates from SPEC 3.1 / 5.3)
- **Spec says:** `handle_new_user` must raise an exception when `role` is missing or invalid.
- **Decision:** a missing/empty `role` becomes `patient`; a role that is present but invalid
  (anything other than `patient | caregiver | doctor`) is still rejected.
- **Why:** users created from the Supabase dashboard or via invitations have no `role`
  in metadata, and the strict rule made those signups fail.
- **Where:** `supabase/migrations/20261022000005_security_hardening.sql`.
- **Revert:** if all users are created through the Register page (which always sends `role`),
  restore the strict check from migration 00002.

## D-002: Function privileges are closed by default (migration 00005)
- `EXECUTE` is revoked from `public`, `anon` and `authenticated` on all functions in `public`,
  and default privileges for new functions are revoked too.
- **Rule for every future function:** add an explicit `grant execute ... to <role>` in the
  same migration, otherwise callers get `permission denied`.
- Internal functions (`run_tick`, `extend_dose_horizon`, `get_setting_int`) are `service_role` only.
  `pg_cron` runs as `postgres` and the Edge Function uses `service_role`, so both keep working.
- Public emergency RPCs (`get_emergency_alert`, `ack_emergency`) stay executable by `anon`.

## D-003: `generate_doses` stays callable by `authenticated`, with an ownership check
- A signed-in user may only generate doses for themself (`auth.uid() = p_patient`).
  Calls with no `auth.uid()` (service_role / cron / internal) are allowed.
- Also fixed a bug: the loop record `m` clashed with the table alias `m`
  (`record "m" is not assigned yet`). Renamed to `med` / `md`.

## D-004: pgcrypto functions need the `extensions` schema
- `get_emergency_alert`, `ack_emergency` and `run_tick` use `search_path = public, extensions`
  so `digest()` and `gen_random_bytes()` resolve on Supabase.

## D-005: `patients` column-level update grants
- `authenticated` can update only: `date_of_birth, gender, blood_type, chronic_conditions,
  allergies, lives_alone, timezone`.
- `share_code` and `demo_mode` change only through `regenerate_share_code()` / `set_demo_mode()`.

## D-006: Authorization never trusts `user_metadata`
- `lib/auth/route-guard.ts` reads the role from `profiles` only. No profile/role => redirect to login.
- Missing Supabase env vars are tolerated only when `NODE_ENV === 'development'`
  (production fails closed).
- `redirect()` is never called inside `try/catch` (it works by throwing).
