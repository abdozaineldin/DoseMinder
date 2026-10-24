import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/routing';
import { NotConnected } from '@/components/patient/NotConnected';
import { ProfileEditForm, type ProfileInitial } from '@/components/patient/ProfileEditForm';
import { getPatientContext } from '@/lib/patient/data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: `${t('profile')} — DoseMinder` };
}

export default async function EditProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'patient' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const ctx = await getPatientContext();
  if (!ctx) return <NotConnected locale={locale} />;

  const supabase = await createClient();
  const [{ data: profile }, { data: patient }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', ctx.userId).maybeSingle(),
    supabase
      .from('patients')
      .select('date_of_birth, gender, blood_type, allergies, chronic_conditions, lives_alone, timezone')
      .eq('id', ctx.userId)
      .maybeSingle(),
  ]);
  const p = (profile ?? {}) as { full_name?: string; phone?: string | null };
  const pt = (patient ?? {}) as {
    date_of_birth?: string | null;
    gender?: 'male' | 'female' | null;
    blood_type?: string | null;
    allergies?: string[];
    chronic_conditions?: string[];
    lives_alone?: boolean;
    timezone?: string;
  };

  const initial: ProfileInitial = {
    userId: ctx.userId,
    fullName: p.full_name ?? ctx.fullName,
    phone: p.phone ?? '',
    dateOfBirth: pt.date_of_birth ?? '',
    gender: pt.gender ?? '',
    bloodType: pt.blood_type ?? '',
    allergies: pt.allergies ?? [],
    conditions: pt.chronic_conditions ?? [],
    livesAlone: pt.lives_alone ?? false,
    timezone: pt.timezone ?? ctx.timezone,
  };

  return (
    <div className="space-y-5">
      <Link href="/patient/me" className="text-sm font-semibold text-primary hover:underline">
        {tNav('me')}
      </Link>
      <div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">{t('editProfileTitle')}</h1>
        <p className="text-sm text-muted mt-1">{t('editProfileDesc')}</p>
      </div>
      <ProfileEditForm initial={initial} />
    </div>
  );
}
