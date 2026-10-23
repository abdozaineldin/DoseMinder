import { getTranslations } from 'next-intl/server';
import { EmptyState } from '@/components/shared/EmptyState';

/** Shown when the signed-in patient's data can't be loaded (e.g. Supabase env not set). */
export async function NotConnected({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'auth' });
  const c = await getTranslations({ locale, namespace: 'common' });
  return <EmptyState title={c('error')} description={t('notConfigured')} />;
}
