import * as React from 'react';
import { Logo } from '@/components/shared/Logo';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ConnectionPill } from '@/components/shared/ConnectionPill';
import { CaregiverNav } from '@/components/caregiver/CaregiverNav';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { protectRoleRoute } from '@/lib/auth/route-guard';

export default async function CaregiverLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await protectRoleRoute('caregiver', locale);
  const t = await getTranslations({ locale, namespace: 'shells' });

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink pb-18 lg:pb-0">
      {/* Caregiver Top Bar */}
      <header className="sticky top-0 z-30 w-full bg-paper/90 backdrop-blur-md border-b border-line px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/caregiver/family" className="inline-block">
            <Logo size="sm" />
          </Link>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-saffron-tint/60 text-ink text-xs font-semibold border border-saffron/30">
            {t('caregiverRoleBadge')}
          </span>
          <ConnectionPill state="online" />
        </div>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        <CaregiverNav />
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
