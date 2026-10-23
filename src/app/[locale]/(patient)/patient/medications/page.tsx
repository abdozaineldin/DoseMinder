import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PillIcon } from '@/components/shared/PillIcon';
import { EmptyState } from '@/components/shared/EmptyState';
import { NotConnected } from '@/components/patient/NotConnected';
import { getMedications, getPatientContext } from '@/lib/patient/data';
import { formatClock, formatDays, type AppLocale } from '@/lib/format';
import { Clock } from 'lucide-react';
import type { MedForm } from '@/db';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: `${t('medications')} — DoseMinder` };
}

export default async function PatientMedicationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'patient' });
  const tShells = await getTranslations({ locale, namespace: 'shells' });
  const tMeal = await getTranslations({ locale, namespace: 'meal' });
  const tForm = await getTranslations({ locale, namespace: 'form' });

  const ctx = await getPatientContext();
  if (!ctx) return <NotConnected locale={locale} />;
  const meds = await getMedications();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">{tShells('medicationsTitle')}</h1>
        {meds.length > 0 && <p className="text-sm text-muted mt-1">{t('medsCount', { n: meds.length })}</p>}
      </div>

      {meds.length === 0 ? (
        // TODO(Phase 3): add an action button that opens the add-medication wizard.
        <EmptyState title={t('medsEmptyTitle')} description={t('medsEmptyDesc')} />
      ) : (
        <ul className="space-y-3">
          {meds.map((m) => (
            <li key={m.id} className="rounded-3xl border border-line bg-card p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary-tint shrink-0">
                  <PillIcon form={m.form as MedForm} color={m.color} size={30} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading font-bold text-lg text-ink break-words">
                    <bdi dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                      {m.name}
                      {m.strength ? ` ${m.strength}` : ''}
                    </bdi>
                  </h2>
                  <p className="text-sm text-muted">
                    {tForm(m.form)} · {m.dose_amount}
                    {m.meal !== 'any' && ` · ${tMeal(m.meal)}`}
                  </p>
                </div>
              </div>
              {m.schedule && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-line">
                  {m.schedule.times.map((time) => (
                    <span
                      key={time}
                      className="inline-flex items-center gap-1.5 rounded-full bg-sand/70 border border-line px-3 py-1 text-sm font-semibold text-ink"
                    >
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <bdi dir="ltr">{formatClock(time, locale)}</bdi>
                    </span>
                  ))}
                  <span className="text-xs text-muted">
                    {formatDays(m.schedule.days_of_week, locale, t('everyDay'))}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
