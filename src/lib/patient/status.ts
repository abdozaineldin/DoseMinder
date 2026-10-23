import type { DoseStatus } from '@/db';
import type { StatusChipType } from '@/components/shared/StatusChip';
import type { DoseRingStatus } from '@/components/shared/DoseRing';

export interface DoseRow {
  id: string;
  scheduled_at: string;
  status: DoseStatus;
  taken_at: string | null;
  was_late: boolean;
  medication: { id: string; name: string; strength: string | null; form: string; color: string; dose_amount: string; meal: string } | null;
}

/** Early window: a dose can be confirmed up to 30 min before its time (SPEC §3.3). */
const EARLY_MS = 30 * 60 * 1000;

export function isDue(d: DoseRow, now: number): boolean {
  return d.status === 'scheduled' && new Date(d.scheduled_at).getTime() <= now + EARLY_MS;
}

export function chipFor(d: DoseRow, now: number): StatusChipType {
  if (d.status === 'taken') return d.was_late ? 'late' : 'taken';
  if (d.status === 'missed') return 'missed';
  return isDue(d, now) ? 'due_now' : 'upcoming';
}

export function ringFor(d: DoseRow, now: number): DoseRingStatus {
  if (d.status === 'taken') return 'taken';
  if (d.status === 'missed') return 'missed';
  return isDue(d, now) ? 'due' : 'upcoming';
}
