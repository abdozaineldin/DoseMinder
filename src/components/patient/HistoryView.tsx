'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { StatusChip } from '@/components/shared/StatusChip';
import { addDays, formatDayHeading, type AppLocale } from '@/lib/format';

export interface HistoryItem {
  id: string;
  day: string; // YYYY-MM-DD in the patient's timezone
  time: string; // already formatted
  name: string;
  kind: 'taken' | 'late' | 'missed';
  takenAt: string | null;
}

type Filter = 'all' | 'taken' | 'missed' | 'late';

export function HistoryView({
  items,
  todayKey,
  locale,
}: {
  items: HistoryItem[];
  todayKey: string;
  locale: AppLocale;
}) {
  const t = useTranslations('patient');
  const [filter, setFilter] = React.useState<Filter>('all');

  // adherence = taken / (taken + missed); late confirmations count as taken (SPEC §3.4)
  const takenCount = items.filter((i) => i.kind !== 'missed').length;
  const missedCount = items.length - takenCount;
  const adherence = items.length ? Math.round((takenCount / items.length) * 100) : null;

  // 30-day strip: one cell per day
  const strip = Array.from({ length: 30 }, (_, i) => {
    const key = addDays(todayKey, i - 29);
    const day = items.filter((x) => x.day === key);
    const state = !day.length
      ? 'none'
      : day.some((x) => x.kind === 'missed')
        ? 'missed'
        : day.some((x) => x.kind === 'late')
          ? 'late'
          : 'taken';
    return { key, state };
  });

  const visible = items.filter((i) => filter === 'all' || i.kind === filter);
  const groups = new Map<string, HistoryItem[]>();
  for (const i of visible) groups.set(i.day, [...(groups.get(i.day) ?? []), i]);

  const filters: Filter[] = ['all', 'taken', 'missed', 'late'];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-line bg-card p-5 space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted">{t('adherence')}</p>
            <p className="font-heading text-4xl font-bold text-ink">
              <bdi dir="ltr">{adherence === null ? '—' : `${adherence}%`}</bdi>
            </p>
          </div>
          <p className="text-xs text-muted text-end">
            {t('adherenceBreakdown', { taken: takenCount, missed: missedCount })}
          </p>
        </div>
        <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[3px]" dir="ltr" aria-hidden="true">
          {strip.map((s) => (
            <span
              key={s.key}
              className={cn(
                'h-6 rounded-[4px]',
                s.state === 'taken' && 'bg-taken',
                s.state === 'late' && 'bg-saffron',
                s.state === 'missed' && 'bg-missed',
                s.state === 'none' && 'bg-line/70'
              )}
            />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t('filters')}>
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              'h-10 px-4 rounded-full border text-sm font-semibold transition-colors cursor-pointer',
              filter === f
                ? 'bg-primary text-white border-primary'
                : 'bg-card text-ink border-line hover:border-primary'
            )}
          >
            {t(`filter_${f}`)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-center text-muted py-10">{t('historyFilterEmpty')}</p>
      ) : (
        [...groups.entries()].map(([day, rows]) => (
          <section key={day} className="space-y-2">
            <h2 className="font-heading font-bold text-base text-ink first-letter:uppercase">
              {formatDayHeading(day, todayKey, locale)}
            </h2>
            <ul className="rounded-3xl border border-line bg-card divide-y divide-line overflow-hidden">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink break-words">
                      <bdi dir="ltr" style={{ unicodeBidi: 'isolate' }}>{r.name}</bdi>
                    </p>
                    <p className="text-xs text-muted">
                      <bdi dir="ltr">{r.time}</bdi>
                      {r.takenAt && (
                        <>
                          {' · '}
                          {t('takenAt')} <bdi dir="ltr">{r.takenAt}</bdi>
                        </>
                      )}
                    </p>
                  </div>
                  <StatusChip status={r.kind} size="sm" />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
