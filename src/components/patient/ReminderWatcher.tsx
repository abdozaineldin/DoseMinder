'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';

/** While the app is open, opens the in-page reminder screen at the dose time
 *  even if the push never arrived (SPEC §7). Renders nothing. */
export function ReminderWatcher({ doseId, scheduledAt }: { doseId: string; scheduledAt: string }) {
  const router = useRouter();
  React.useEffect(() => {
    const ms = new Date(scheduledAt).getTime() - Date.now();
    // setTimeout caps at ~24.8 days; only arm for doses within the next 12 hours
    if (ms <= 0 || ms > 12 * 3600 * 1000) return;
    const id = window.setTimeout(() => router.push(`/patient/reminder/${doseId}`), ms);
    return () => window.clearTimeout(id);
  }, [doseId, scheduledAt, router]);
  return null;
}
