import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SignOutButton } from '@/components/shared/SignOutButton';
import { NotConnected } from '@/components/patient/NotConnected';
import { getPatientContext } from '@/lib/patient/data';
import { Link } from '@/i18n/routing';
import { Accessibility, IdCard } from 'lucide-react';

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
  const hasMedicalId = ctx.bloodType || ctx.allergies.length > 0 || ctx.chronicConditions.length > 0;

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

        <div className="rounded-2xl bg-sand/50 border border-line p-4">
          <p className="text-xs font-semibold text-muted">{t('shareCode')}</p>
          <p dir="ltr" className="text-start font-mono font-bold text-2xl text-primary tracking-wider mt-1">
            {ctx.shareCode}
          </p>
          <p className="text-xs text-muted mt-2">{t('shareCodeHint')}</p>
        </div>
      </section>

      {hasMedicalId && (
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
              <dd className="font-medium text-ink text-end">{ctx.allergies.join('، ') || dash}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">{t('conditions')}</dt>
              <dd className="font-medium text-ink text-end">{ctx.chronicConditions.join('، ') || dash}</dd>
            </div>
          </dl>
        </section>
      )}

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
