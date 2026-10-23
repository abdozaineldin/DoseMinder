import * as React from 'react';
import { Logo } from '@/components/shared/Logo';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LiveConnectionPill } from '@/components/shared/LiveConnectionPill';
import { PatientNav } from '@/components/patient/PatientNav';
import { Link } from '@/i18n/routing';

import { protectRoleRoute } from '@/lib/auth/route-guard';

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await protectRoleRoute('patient', locale);
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink pb-20 lg:pb-0">
      {/* ------------------------------------------------------------------- */}
      {/* Patient Header (Sticky)                                             */}
      {/* ------------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 w-full bg-paper/90 backdrop-blur-md border-b border-line px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/patient/today" className="inline-block">
            <Logo size="sm" />
          </Link>
          <LiveConnectionPill />
        </div>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* Main Layout Area: Desktop Sidebar + Centered Content Column         */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Desktop Sidebar / Mobile Bottom Nav */}
        <PatientNav />

        {/* Content Column (max 720px per SPEC §10) */}
        <main className="flex-1 w-full max-w-[720px] mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
