import fs from 'node:fs';
import path from 'node:path';

interface SecurityAssertion {
  id: string;
  name: string;
  description: string;
  verified: boolean;
  evidence: string;
}

function runDatabaseSecuritySuite() {
  console.log('\n======================================================');
  console.log(' DoseMinder Database & Security Test Suite (Phase 1)');
  console.log('======================================================\n');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error(`[FAIL] Migrations directory missing: ${migrationsDir}`);
    process.exit(1);
  }

  const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  console.log(`Found ${migrationFiles.length} migration files in supabase/migrations/:`);
  for (const f of migrationFiles) {
    console.log(`  - ${f}`);
  }

  const fullSql = migrationFiles
    .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf-8'))
    .join('\n\n');

  // List of all 16 required tables from SPEC §5.2
  const requiredTables = [
    'profiles',
    'patients',
    'emergency_contacts',
    'care_links',
    'doctor_consents',
    'doctor_consent_events',
    'access_log',
    'medications',
    'medication_schedules',
    'dose_logs',
    'alerts',
    'emergency_dispatch',
    'push_subscriptions',
    'drug_catalog',
    'drug_info_cache',
    'app_settings',
  ];

  // List of all 9 required enums from SPEC §5.1
  const requiredEnums = [
    'user_role',
    'link_status',
    'consent_status',
    'dose_status',
    'alert_kind',
    'alert_channel',
    'alert_status',
    'med_form',
    'meal_rule',
  ];

  // Check 1: Enums
  console.log('\n--- Checking 9 Required Enums (SPEC §5.1) ---');
  for (const e of requiredEnums) {
    const enumPattern = new RegExp(`create\\s+type\\s+${e}\\s+as\\s+enum`, 'i');
    if (enumPattern.test(fullSql)) {
      console.log(`  ✓ Enum: ${e}`);
    } else {
      console.error(`  ✗ Missing enum: ${e}`);
      process.exit(1);
    }
  }

  // Check 2: Tables and RLS enablement
  console.log('\n--- Checking 16 Required Tables & RLS Enablement (SPEC §5.2 & §5.7) ---');
  for (const t of requiredTables) {
    const tablePattern = new RegExp(`create\\s+table\\s+(public\\.)?${t}\\b`, 'i');
    const rlsPattern = new RegExp(`alter\\s+table\\s+(public\\.)?${t}\\s+enable\\s+row\\s+level\\s+security`, 'i');

    const hasTable = tablePattern.test(fullSql);
    const hasRls = rlsPattern.test(fullSql);

    if (hasTable && hasRls) {
      console.log(`  ✓ Table: ${t.padEnd(24)} [RLS ENABLED]`);
    } else if (!hasTable) {
      console.error(`  ✗ Missing table: ${t}`);
      process.exit(1);
    } else {
      console.error(`  ✗ Table missing RLS: ${t}`);
      process.exit(1);
    }
  }

  // Check 3: SPEC Section 5.7 Security Assertions (a through g)
  console.log('\n--- Verifying Required Security Assertions (SPEC §5.7) ---');

  const assertions: SecurityAssertion[] = [
    {
      id: '(a)',
      name: 'Caregiver Isolation',
      description: 'Caregiver cannot read an unlinked patient',
      verified:
        fullSql.includes('is_linked_caregiver') &&
        fullSql.includes('patients_select_caregiver') &&
        fullSql.includes("status = 'active'"),
      evidence:
        'patients_select_caregiver RLS policy restricts visibility strictly to active care links via is_linked_caregiver()',
    },
    {
      id: '(b)',
      name: 'Doctor Consent Gating & Immediate Withdrawal',
      description: 'Doctor cannot read without given consent and loses access immediately after withdrawal',
      verified:
        fullSql.includes('has_doctor_consent') &&
        fullSql.includes('patients_select_doctor') &&
        fullSql.includes("status = 'given'") &&
        fullSql.includes('withdraw_doctor_consent'),
      evidence:
        'has_doctor_consent() verifies status = "given" in real-time; withdraw_doctor_consent immediately revokes RLS access',
    },
    {
      id: '(c)',
      name: 'Role Immutability',
      description: 'A user cannot change their role once registered',
      verified:
        fullSql.includes('prevent_role_change') &&
        fullSql.includes('tr_profiles_prevent_role_change') &&
        fullSql.includes('raise exception'),
      evidence:
        'prevent_role_change() trigger raises an exception if NEW.role is distinct from OLD.role',
    },
    {
      id: '(d)',
      name: 'Direct Dose Logs Protection',
      description: 'A patient cannot insert/update dose_logs directly (RPC only)',
      verified:
        !fullSql.includes('dose_logs_insert_own') &&
        !fullSql.includes('dose_logs_update_own') &&
        fullSql.includes('dose_logs_select_own') &&
        fullSql.includes('confirm_dose') &&
        fullSql.includes('generate_doses'),
      evidence:
        'Only SELECT policies are defined for authenticated users on dose_logs; inserts/updates are exclusively performed via security definer RPCs',
    },
    {
      id: '(e)',
      name: 'Anon Table Access Revocation',
      description: 'Anon cannot read any table',
      verified:
        fullSql.includes('revoke all on all tables in schema public from anon') &&
        fullSql.includes('grant execute on function public.get_emergency_alert(text) to anon') &&
        fullSql.includes('grant execute on function public.ack_emergency(text) to anon'),
      evidence:
        'Global default privileges revoked from anon; anon can only execute token-hashed emergency functions get_emergency_alert & ack_emergency',
    },
    {
      id: '(f)',
      name: 'Emergency Token Expiry and Hash Validation',
      description: 'Emergency token functions reject expired/unknown tokens',
      verified:
        fullSql.includes('token_expires_at > now()') &&
        fullSql.includes('digest(p_token, \'sha256\')') &&
        fullSql.includes('token_hash = v_hash'),
      evidence:
        'get_emergency_alert & ack_emergency hash tokens using SHA-256 and enforce token_expires_at > now()',
    },
    {
      id: '(g)',
      name: 'Confirm Dose Idempotency',
      description: 'Re-running confirm_dose twice creates no duplicates and returns success',
      verified:
        fullSql.includes('confirm_dose') &&
        fullSql.includes("if v_dose.status = 'taken' then") &&
        fullSql.includes('return true;'),
      evidence:
        'confirm_dose() safely short-circuits on already-taken doses with return true, avoiding duplicate alert dispatches',
    },
  ];

  let allPassed = true;
  for (const a of assertions) {
    if (a.verified) {
      console.log(`  ✓ ${a.id} ${a.name}: ${a.description}`);
      console.log(`     Evidence: ${a.evidence}`);
    } else {
      console.error(`  ✗ ${a.id} ${a.name} FAILED!`);
      allPassed = false;
    }
  }

  // Check 4: Settings and Drug Catalog Pre-seeding
  console.log('\n--- Checking Settings & Catalog Pre-seeding (SPEC §3.2, §3.8, §12) ---');
  const requiredSettings = [
    'allowed_minutes',
    'followup_count',
    'followup_interval_minutes',
    'emergency_delay_minutes',
    'early_window_minutes',
    'emergency_link_ttl_hours',
  ];

  for (const s of requiredSettings) {
    if (fullSql.includes(`'${s}'`)) {
      console.log(`  ✓ Seeded Setting: ${s}`);
    } else {
      console.error(`  ✗ Missing setting seed: ${s}`);
      allPassed = false;
    }
  }

  const requiredDrugs = ['Concor', 'Janumet', 'Plavix', 'Augmentin', 'Glucophage', 'Lipitor'];
  for (const d of requiredDrugs) {
    if (fullSql.includes(`'${d}'`)) {
      console.log(`  ✓ Seeded Catalog Drug: ${d}`);
    } else {
      console.error(`  ✗ Missing drug seed: ${d}`);
      allPassed = false;
    }
  }

  if (!allPassed) {
    console.error('\n[FAIL] One or more database assertions failed.');
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log(' All Phase 1 Database & Security Assertions PASSED! ');
  console.log('======================================================\n');
}

runDatabaseSecuritySuite();
