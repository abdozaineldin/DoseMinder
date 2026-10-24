import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MedicationWizard } from '@/components/patient/MedicationWizard';
import { getPatientContext } from '@/lib/patient/data';
import { NotConnected } from '@/components/patient/NotConnected';
import type { AppLocale } from '@/lib/format';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: `${t('newMedication')} — DoseMinder` };
}

export default async function NewMedicationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as AppLocale;
  const t = await getTranslations({ locale, namespace: 'patient' });

  const ctx = await getPatientContext();
  if (!ctx) return <NotConnected locale={locale} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
          {t('addMedication')}
        </h1>
      </div>

      <MedicationWizard />
    </div>
  );
}
