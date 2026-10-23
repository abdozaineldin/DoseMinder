import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/shared/EmptyState';
import { NotConnected } from '@/components/patient/NotConnected';
import { HistoryView, type HistoryItem } from '@/components/patient/HistoryView';
import { getHistoryDoses, getPatientContext } from '@/lib/patient/data';
import { dayKey, formatTimeAt, type AppLocale } from '@/lib/format';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: `${t('history')} — DoseMinder` };
}

export default async function PatientHistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'patient' });
  const tShells = await getTranslations({ locale, namespace: 'shells' });

  const ctx = await getPatientContext();
  if (!ctx) return <NotConnected locale={locale} />;

  const { doses, todayKey } = await getHistoryDoses(ctx.timezone, 30);
  const items: HistoryItem[] = doses.map((d) => ({
    id: d.id,
    day: dayKey(d.scheduled_at, ctx.timezone),
    time: formatTimeAt(d.scheduled_at, locale, ctx.timezone),
    name: d.medication ? `${d.medication.name}${d.medication.strength ? ` ${d.medication.strength}` : ''}` : '',
    kind: d.status === 'missed' ? 'missed' : d.status === 'taken' ? (d.was_late ? 'late' : 'taken') : 'taken',
    takenAt: d.taken_at ? formatTimeAt(d.taken_at, locale, ctx.timezone) : null,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">{tShells('historyTitle')}</h1>
        <p className="text-sm text-muted mt-1">{t('historySubtitle')}</p>
      </div>
      {items.length === 0 ? (
        <EmptyState title={t('historyEmptyTitle')} description={t('historyEmptyDesc')} />
      ) : (
        <HistoryView items={items} todayKey={todayKey} locale={locale} />
      )}
    </div>
  );
}
