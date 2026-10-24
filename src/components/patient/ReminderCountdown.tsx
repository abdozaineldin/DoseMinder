'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

/** Remaining confirmation window (allowed_minutes after the scheduled time) or "overdue". */
export function ReminderCountdown({ scheduledAt, allowedMinutes }: { scheduledAt: string; allowedMinutes: number }) {
  const t = useTranslations('patient');
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (now === null) return null;

  const deadline = new Date(scheduledAt).getTime() + allowedMinutes * 60000;
  const left = deadline - now;
  if (left <= 0) return <p className="font-semibold text-missed">{t('reminderOverdue')}</p>;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <p className="text-muted">
      {t('reminderTimeRemaining')}{' '}
      <bdi dir="ltr" className="font-heading font-bold text-ink">
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </bdi>
    </p>
  );
}
