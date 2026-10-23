import { getTranslations } from 'next-intl/server';
import { AuthShell } from '@/components/auth/AuthShell';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return {
    title: `${t('registerTitle')} — DoseMinder`,
  };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <AuthShell title={t('registerTitle')} subtitle={t('registerSubtitle')}>
      <Suspense fallback={<Skeleton className="w-full h-80 rounded-2xl" />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
