import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PillIcon } from '@/components/shared/PillIcon';
import { EmptyState } from '@/components/shared/EmptyState';
import { NotConnected } from '@/components/patient/NotConnected';
import { getMedications, getPatientContext } from '@/lib/patient/data';
import { formatClock, formatDays, type AppLocale } from '@/lib/format';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Clock, Plus, ChevronRight } from 'lucide-react';
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">{tShells('medicationsTitle')}</h1>
          {meds.length > 0 && <p className="text-sm text-muted mt-1">{t('medsCount', { n: meds.length })}</p>}
        </div>
        <Link href="/patient/medications/new">
          <Button variant="primary" size="sm" className="gap-1.5 h-10 px-4 rounded-xl font-medium">
            <Plus className="w-4 h-4" />
            <span>{t('addMedication')}</span>
          </Button>
        </Link>
      </div>

      {meds.length === 0 ? (
        <EmptyState
          title={t('medsEmptyTitle')}
          description={t('medsEmptyDesc')}
          actionLabel={t('addMedication')}
          actionHref="/patient/medications/new"
        />
      ) : (
        <ul className="space-y-3">
          {meds.map((m) => (
            <li key={m.id}>
              <Link
                href={`/patient/medications/${m.id}`}
                className="block rounded-3xl border border-line bg-card p-4 sm:p-5 space-y-3 hover:border-primary/50 transition-colors shadow-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
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
                  <ChevronRight className="w-5 h-5 text-muted/60 rtl:rotate-180 shrink-0" />
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
