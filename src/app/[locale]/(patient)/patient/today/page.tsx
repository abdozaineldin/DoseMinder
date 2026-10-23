import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PillIcon } from '@/components/shared/PillIcon';
import { DoseRing } from '@/components/shared/DoseRing';
import { StatusChip } from '@/components/shared/StatusChip';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDoseButton } from '@/components/patient/ConfirmDoseButton';
import { NotConnected } from '@/components/patient/NotConnected';
import { getPatientContext, getTodayDoses } from '@/lib/patient/data';
import { chipFor, isDue, ringFor, type DoseRow } from '@/lib/patient/status';
import { formatLongDate, formatTimeAt, hourIn, type AppLocale } from '@/lib/format';
import { CheckCircle2 } from 'lucide-react';
import type { MedForm } from '@/db';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: `${t('today')} — DoseMinder` };
}

function timeOfDay(hour: number) {
  if (hour >= 5 && hour < 9) return { grad: 'var(--grad-dawn)', greet: 'greetingMorning' } as const;
  if (hour >= 9 && hour < 12) return { grad: 'var(--grad-day)', greet: 'greetingMorning' } as const;
  if (hour >= 12 && hour < 17) return { grad: 'var(--grad-day)', greet: 'greetingAfternoon' } as const;
  if (hour >= 17 && hour < 20) return { grad: 'var(--grad-evening)', greet: 'greetingEvening' } as const;
  return { grad: 'var(--grad-night)', greet: 'greetingEvening' } as const;
}

function MedName({ d }: { d: DoseRow }) {
  const m = d.medication;
  if (!m) return null;
  return (
    <bdi dir="ltr" style={{ unicodeBidi: 'isolate' }}>
      {m.name}
      {m.strength ? ` ${m.strength}` : ''}
    </bdi>
  );
}

export default async function PatientTodayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'patient' });
  const tShells = await getTranslations({ locale, namespace: 'shells' });
  const tMeal = await getTranslations({ locale, namespace: 'meal' });

  const ctx = await getPatientContext();
  if (!ctx) return <NotConnected locale={locale} />;

  const { doses } = await getTodayDoses(ctx.timezone);
  const nowDate = new Date();
  const now = nowDate.getTime();
  const tod = timeOfDay(hourIn(nowDate, ctx.timezone));
  const firstName = ctx.fullName.trim().split(/\s+/)[0] || ctx.fullName;

  const taken = doses.filter((d) => d.status === 'taken').length;
  const next = doses.find((d) => d.status === 'scheduled');
  const missed = doses.filter((d) => d.status === 'missed');
  const allDone = doses.length > 0 && doses.every((d) => d.status === 'taken');

  return (
    <div className="space-y-5">
      {/* Time-of-day header (SPEC §9.3) */}
      <div
        className="rounded-3xl p-5 sm:p-6 border border-line shadow-xs flex items-center justify-between gap-4"
        style={{ background: tod.grad }}
      >
        <div className="min-w-0">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {tShells('todaySchedule')}
          </span>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink mt-1 break-words">
            {tShells(tod.greet, { name: firstName })}
          </h1>
          <p className="text-sm text-muted mt-1">{formatLongDate(nowDate, locale, ctx.timezone)}</p>
        </div>
        {doses.length > 0 && (
          <DoseRing
            size={96}
            strokeWidth={9}
            segments={doses.map((d) => ({ status: ringFor(d, now) }))}
            centerText={`${taken}/${doses.length}`}
            className="shrink-0"
          />
        )}
      </div>

      {doses.length === 0 ? (
        <EmptyState
          title={t('todayEmptyTitle')}
          description={t('todayEmptyDesc')}
          actionLabel={t('addMedication')}
          actionHref="/patient/medications/new"
        />
      ) : (
        <>
          {/* Next dose / all done */}
          {allDone ? (
            <div className="rounded-3xl border border-taken/30 bg-taken/10 p-6 flex items-center gap-4">
              <CheckCircle2 className="w-10 h-10 text-taken shrink-0" />
              <p className="font-heading font-bold text-xl text-ink">{t('allDoneToday')}</p>
            </div>
          ) : next && next.medication ? (
            <section className="rounded-3xl border border-primary/30 bg-card p-5 sm:p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-muted">{t('nextDose')}</p>
                <StatusChip status={chipFor(next, now)} />
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary-tint shrink-0">
                  <PillIcon form={next.medication.form as MedForm} color={next.medication.color} size={36} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading font-bold text-xl text-ink break-words">
                    <MedName d={next} />
                  </h2>
                  <p className="text-sm text-muted">
                    {next.medication.dose_amount}
                    {next.medication.meal !== 'any' && ` · ${tMeal(next.medication.meal)}`}
                  </p>
                </div>
              </div>
              {isDue(next, now) ? (
                <ConfirmDoseButton doseId={next.id} />
              ) : (
                <p className="text-base text-muted">
                  {t('scheduledFor')}{' '}
                  <bdi dir="ltr" className="font-heading font-bold text-ink">
                    {formatTimeAt(next.scheduled_at, locale, ctx.timezone)}
                  </bdi>
                </p>
              )}
            </section>
          ) : null}

          {/* Timeline of all doses today */}
          <section className="space-y-2">
            <h2 className="font-heading font-bold text-lg text-ink">{t('timeline')}</h2>
            <ol className="rounded-3xl border border-line bg-card divide-y divide-line overflow-hidden">
              {doses.map((d) => (
                <li key={d.id} className="flex items-center gap-3 p-4">
                  {d.medication && (
                    <PillIcon form={d.medication.form as MedForm} color={d.medication.color} size={28} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink break-words">
                      <MedName d={d} />
                    </p>
                    <p className="text-sm text-muted">
                      <bdi dir="ltr" className="font-heading font-semibold">
                        {formatTimeAt(d.scheduled_at, locale, ctx.timezone)}
                      </bdi>
                    </p>
                  </div>
                  <StatusChip status={chipFor(d, now)} size="sm" className="shrink-0" />
                </li>
              ))}
            </ol>
          </section>

          {/* Missed doses can still be confirmed late (was_late) */}
          {missed.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-heading font-bold text-lg text-missed">{t('missedTitle')}</h2>
              <ul className="space-y-2">
                {missed.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-2xl border border-missed/30 bg-missed/5 p-3">
                    <span className="min-w-0 flex-1 break-words font-medium text-ink">
                      <MedName d={d} />
                    </span>
                    <ConfirmDoseButton doseId={d.id} variant="compact" late />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
