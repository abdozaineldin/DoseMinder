import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { PillIcon } from '@/components/shared/PillIcon';
import { ConfirmDoseButton } from '@/components/patient/ConfirmDoseButton';
import { ReminderCountdown } from '@/components/patient/ReminderCountdown';
import { NotConnected } from '@/components/patient/NotConnected';
import { getPatientContext } from '@/lib/patient/data';
import { formatTimeAt, type AppLocale } from '@/lib/format';
import type { DoseRow } from '@/lib/patient/status';
import { ALLOWED_MINUTES } from '@/lib/patient/status';
import type { MedForm } from '@/db';
import { Bell, CheckCircle2 } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: `${t('reminder')} — DoseMinder` };
}

export default async function ReminderPage({ params }: { params: Promise<{ locale: string; doseId: string }> }) {
  const { locale: rawLocale, doseId } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'patient' });
  const tMeal = await getTranslations({ locale, namespace: 'meal' });

  const ctx = await getPatientContext();
  if (!ctx) return <NotConnected locale={locale} />;

  // RLS guarantees a patient only ever sees their own doses
  const supabase = await createClient();
  const { data } = await supabase
    .from('dose_logs')
    .select(
      'id, scheduled_at, status, taken_at, was_late, medication:medications(id, name, strength, form, color, dose_amount, meal)'
    )
    .eq('id', doseId)
    .maybeSingle();
  const dose = data as unknown as DoseRow | null;
  if (!dose || !dose.medication) notFound();
  const m = dose.medication;

  return (
    <div className="space-y-6 max-w-md mx-auto text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-saffron/20 flex items-center justify-center">
          <Bell className="w-7 h-7 text-saffron" />
        </div>
        <h1 className="font-heading font-bold text-xl text-muted">{t('reminderHeading')}</h1>
      </div>

      <section className="rounded-3xl border border-line bg-card p-6 space-y-4 shadow-md">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-primary-tint flex items-center justify-center">
          <PillIcon form={m.form as MedForm} color={m.color} size={48} />
        </div>
        <h2 className="font-heading font-bold text-3xl text-ink break-words">
          <bdi dir="ltr" style={{ unicodeBidi: 'isolate' }}>
            {m.name}
            {m.strength ? ` ${m.strength}` : ''}
          </bdi>
        </h2>
        <p className="text-lg text-ink">
          {m.dose_amount}
          {m.meal !== 'any' && ` · ${tMeal(m.meal)}`}
        </p>
        <p className="font-heading font-bold text-2xl text-primary">
          <bdi dir="ltr">{formatTimeAt(dose.scheduled_at, locale, ctx.timezone)}</bdi>
        </p>

        {dose.status === 'taken' ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-taken/10 border border-taken/30 p-4 text-taken font-semibold">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span>
              {t('reminderAlreadyTaken', {
                time: formatTimeAt(dose.taken_at ?? dose.scheduled_at, locale, ctx.timezone),
              })}
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <ReminderCountdown scheduledAt={dose.scheduled_at} allowedMinutes={ALLOWED_MINUTES} />
            <ConfirmDoseButton doseId={dose.id} />
          </div>
        )}
      </section>

      <Link href="/patient/today" className="inline-block text-primary font-semibold hover:underline">
        {t('backToSchedule')}
      </Link>
    </div>
  );
}
