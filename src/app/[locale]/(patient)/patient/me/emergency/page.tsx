import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { NotConnected } from '@/components/patient/NotConnected';
import { EmergencyContactsManager, type EmergencyContactRow } from '@/components/patient/EmergencyContactsManager';
import { getPatientContext } from '@/lib/patient/data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: `${t('emergency')} — DoseMinder` };
}

export default async function EmergencyContactsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'patient' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const ctx = await getPatientContext();
  if (!ctx) return <NotConnected locale={locale} />;

  const supabase = await createClient();
  const { data } = await supabase
    .from('emergency_contacts')
    .select('id, name, relationship, phone, email, priority')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-5">
      <Link href="/patient/me" className="text-sm font-semibold text-primary hover:underline">
        {tNav('me')}
      </Link>
      <EmergencyContactsManager patientId={ctx.userId} initialContacts={(data ?? []) as unknown as EmergencyContactRow[]} />
      <p className="sr-only">{t('emergencyDesc')}</p>
    </div>
  );
}
