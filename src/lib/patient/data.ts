import { createClient } from '@/lib/supabase/server';
import { zonedDayRange, addDays } from '@/lib/format';
import type { DoseRow } from './status';

/** All reads go through RLS as the signed-in patient. Any failure -> null/[]
 *  so pages show an honest empty/error state instead of fake data (SPEC §0.4). */

export interface PatientContext {
  userId: string;
  fullName: string;
  timezone: string;
  shareCode: string;
  bloodType: string | null;
  allergies: string[];
  chronicConditions: string[];
}

export async function getPatientContext(): Promise<PatientContext | null> {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return null;

    const [{ data: profile }, { data: patient }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      supabase
        .from('patients')
        .select('timezone, share_code, blood_type, allergies, chronic_conditions')
        .eq('id', user.id)
        .maybeSingle(),
    ]);
    if (!profile || !patient) return null;

    return {
      userId: user.id,
      fullName: profile.full_name,
      timezone: patient.timezone,
      shareCode: patient.share_code,
      bloodType: patient.blood_type,
      allergies: patient.allergies ?? [],
      chronicConditions: patient.chronic_conditions ?? [],
    };
  } catch {
    return null;
  }
}

const DOSE_SELECT =
  'id, scheduled_at, status, taken_at, was_late, medication:medications(id, name, strength, form, color, dose_amount, meal)';

async function queryDoses(fromISO: string, toISO: string, asc: boolean): Promise<DoseRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('dose_logs')
      .select(DOSE_SELECT)
      .gte('scheduled_at', fromISO)
      .lt('scheduled_at', toISO)
      .order('scheduled_at', { ascending: asc });
    if (error || !data) return [];
    return data as DoseRow[];
  } catch {
    return [];
  }
}

export async function getTodayDoses(tz: string) {
  const r = zonedDayRange(tz);
  return { key: r.key, doses: await queryDoses(r.startISO, r.endISO, true) };
}

export async function getHistoryDoses(tz: string, days = 30) {
  const today = zonedDayRange(tz);
  const from = zonedDayRange(tz, new Date(Date.parse(`${addDays(today.key, -(days - 1))}T12:00:00Z`)));
  // history = everything up to the end of today that is no longer only "scheduled in the future"
  const doses = await queryDoses(from.startISO, today.endISO, false);
  const now = Date.now();
  return {
    todayKey: today.key,
    doses: doses.filter((d) => d.status !== 'scheduled' || new Date(d.scheduled_at).getTime() <= now),
  };
}

export interface MedicationRow {
  id: string;
  name: string;
  strength: string | null;
  form: string;
  color: string;
  dose_amount: string;
  meal: string;
  instructions: string | null;
  schedule: { times: string[]; days_of_week: number[] } | null;
}

export async function getMedications(): Promise<MedicationRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('medications')
      .select(
        'id, name, strength, form, color, dose_amount, meal, instructions, medication_schedules(times, days_of_week)'
      )
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data.map((m) => {
      const s = m.medication_schedules;
      return {
        id: m.id,
        name: m.name,
        strength: m.strength,
        form: m.form,
        color: m.color,
        dose_amount: m.dose_amount,
        meal: m.meal,
        instructions: m.instructions,
        schedule: Array.isArray(s) ? (s[0] ?? null) : s,
      };
    });
  } catch {
    return [];
  }
}
