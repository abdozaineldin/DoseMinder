import { getTranslations } from 'next-intl/server';
import { EmptyState } from '@/components/shared/EmptyState';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'shells' });
  return {
    title: `${t('patients')} — DoseMinder`,
  };
}

export default async function DoctorPatientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tShells = await getTranslations({ locale, namespace: 'shells' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
            {tShells('patientsListTitle')}
          </h1>
          <p className="text-sm text-muted mt-1">
            {tShells('patients')}
          </p>
        </div>
      </div>

      <EmptyState
        title={tShells('noDoctorPatientsTitle')}
        description={tShells('noDoctorPatientsDesc')}
      />
    </div>
  );
}
