import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Logo } from '@/components/shared/Logo';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { FontScaleControl } from '@/components/shared/FontScaleControl';
import { HighContrastToggle } from '@/components/shared/HighContrastToggle';

export default async function AccessibilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'accessibility' });

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-2 px-3 sm:px-6">
          <Link href="/" className="rounded-lg p-1">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted">{t('subtitle')}</p>
        </div>

        <section className="space-y-4 rounded-3xl border border-line bg-card p-5 sm:p-6">
          <div>
            <h2 className="font-heading text-lg font-bold">{t('fontSize')}</h2>
            <p className="mb-3 text-sm text-muted">{t('fontSizeHint')}</p>
            <FontScaleControl />
          </div>
          <hr className="border-line" />
          <div>
            <h2 className="font-heading text-lg font-bold">{t('highContrast')}</h2>
            <p className="mb-3 text-sm text-muted">{t('highContrastHint')}</p>
            <HighContrastToggle />
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-sand/40 p-5 sm:p-6">
          <p className="mb-1 text-xs font-semibold text-muted">{t('preview')}</p>
          <p className="font-heading text-xl font-bold">{t('previewText')}</p>
        </section>
      </main>
    </div>
  );
}
