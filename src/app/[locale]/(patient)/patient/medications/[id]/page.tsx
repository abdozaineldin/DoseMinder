import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { MedicationWizard } from '@/components/patient/MedicationWizard';
import { getPatientContext } from '@/lib/patient/data';
import { NotConnected } from '@/components/patient/NotConnected';
import type { AppLocale } from '@/lib/format';
import type { MedForm, MealRule } from '@/db';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: `${t('editMedication')} — DoseMinder` };
}

export default async function EditMedicationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'patient' });

  const ctx = await getPatientContext();
  if (!ctx) return <NotConnected locale={locale} />;

  const supabase = await createClient();
  const { data: med } = await supabase
    .from('medications')
    .select(
      'id, name, generic_name, strength, form, color, dose_amount, meal, instructions, start_date, end_date, medication_schedules(times, days_of_week)'
    )
    .eq('id', id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();

  if (!med) {
    notFound();
  }

  const scheduleRaw = med.medication_schedules;
  const schedule = Array.isArray(scheduleRaw) ? scheduleRaw[0] : scheduleRaw;

  const initialData = {
    id: med.id,
    name: med.name,
    generic_name: med.generic_name ?? undefined,
    strength: med.strength ?? undefined,
    form: med.form as MedForm,
    color: med.color,
    dose_amount: med.dose_amount,
    meal: med.meal as MealRule,
    instructions: med.instructions ?? undefined,
    start_date: med.start_date,
    end_date: med.end_date ?? undefined,
    times: schedule?.times ?? ['08:00'],
    days_of_week: schedule?.days_of_week ?? [0, 1, 2, 3, 4, 5, 6],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
          {t('editMedication')}
        </h1>
      </div>

      <MedicationWizard initialData={initialData} />
    </div>
  );
}
