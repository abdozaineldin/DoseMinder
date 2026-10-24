import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SignOutButton } from '@/components/shared/SignOutButton';
import { NotConnected } from '@/components/patient/NotConnected';
import { getPatientContext } from '@/lib/patient/data';
import { Link } from '@/i18n/routing';
import { ShareCodeCard } from '@/components/patient/ShareCodeCard';
import { Accessibility, IdCard, Phone, UserPen } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: `${t('me')} — DoseMinder` };
}

export default async function PatientMePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'patient' });
  const tShells = await getTranslations({ locale, namespace: 'shells' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const ctx = await getPatientContext();
  if (!ctx) return <NotConnected locale={locale} />;

  const dash = '—';
  const list = new Intl.ListFormat(locale, { style: 'narrow', type: 'unit' });

  return (
    <div className="space-y-5">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">{tShells('profileTitle')}</h1>

      <section className="rounded-3xl border border-line bg-card p-5 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-tint text-primary flex items-center justify-center font-heading font-bold text-xl shrink-0">
            {ctx.fullName.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-xl text-ink truncate">{ctx.fullName}</p>
            <p className="text-sm text-muted">{tShells('patientRoleBadge')}</p>
          </div>
        </div>

        <ShareCodeCard code={ctx.shareCode} />
      </section>

      <section className="rounded-3xl border border-line bg-card p-5 space-y-3">
          <h2 className="flex items-center gap-2 font-heading font-bold text-lg text-ink">
            <IdCard className="w-5 h-5 text-primary" />
            {t('medicalId')}
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t('bloodType')}</dt>
              <dd className="font-bold text-ink"><bdi dir="ltr">{ctx.bloodType ?? dash}</bdi></dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t('allergies')}</dt>
              <dd className="font-medium text-ink text-end">{list.format(ctx.allergies) || dash}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t('conditions')}</dt>
              <dd className="font-medium text-ink text-end">{list.format(ctx.chronicConditions) || dash}</dd>
            </div>
          </dl>
        </section>

      <Link href="/patient/me/edit" className="flex items-center gap-3 rounded-3xl border border-line bg-card p-5 font-medium text-ink hover:border-primary transition-colors">
        <UserPen className="w-5 h-5 text-primary" />
        <span>{t('editProfileTitle')}</span>
      </Link>

      <Link href="/patient/me/emergency" className="flex items-center gap-3 rounded-3xl border border-line bg-card p-5 font-medium text-ink hover:border-primary transition-colors">
        <Phone className="w-5 h-5 text-primary" />
        <span>{t('emergencyTitle')}</span>
      </Link>

      <Link
        href="/accessibility"
        className="flex items-center gap-3 rounded-3xl border border-line bg-card p-5 font-medium text-ink hover:border-primary transition-colors"
      >
        <Accessibility className="w-5 h-5 text-primary" />
        <span>{tNav('accessibility')}</span>
      </Link>

      <SignOutButton variant="destructive" className="w-full font-heading" />
    </div>
  );
}
