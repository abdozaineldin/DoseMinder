'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Logo } from '@/components/shared/Logo';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  const tAuth = useTranslations('auth');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-paper text-ink">
      {/* ------------------------------------------------------------------- */}
      {/* Desktop Brand Panel — sticky, fills viewport height                 */}
      {/* ------------------------------------------------------------------- */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 lg:sticky lg:top-0 lg:h-screen relative flex-col justify-between p-10 xl:p-12 overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-[#083538] text-white shrink-0">
        {/* Background Decorative Rings */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -start-24 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -end-24 w-96 h-96 rounded-full bg-primary-tint/10 blur-2xl pointer-events-none"
        />

        {/* Top: Logo */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white rounded-lg"
          >
            <Logo
              size="lg"
              className="[&_span]:text-white [&_svg]:text-white [&_.bg-primary]:bg-white [&_.border-primary]:border-white"
            />
          </Link>
        </div>

        {/* Center: Tagline & Pulse Line */}
        <div className="relative z-10 space-y-6 max-w-md">
          <h2 className="font-heading font-bold text-3xl xl:text-4xl leading-snug">
            {tAuth('brandTagline')}
          </h2>
          <p className="text-white/80 text-base leading-relaxed">
            {tAuth('brandDesc')}
          </p>
          {/* Animated ECG Pulse Line */}
          <div className="pt-4" aria-hidden="true">
            <svg
              className="w-full h-12 text-white/40"
              viewBox="0 0 400 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M 0 24 L 140 24 L 160 8 L 180 40 L 200 12 L 220 32 L 235 24 L 400 24"
                className="animate-pulse"
              />
            </svg>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="relative z-10 text-xs text-white/60">
          <bdi dir="ltr" style={{ unicodeBidi: 'isolate' }}>© {new Date().getFullYear()} DoseMinder</bdi>
          {' — '}
          {tAuth('brandFooter')}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Form Side — independently scrollable so tall forms never clip        */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 overflow-y-auto">
        {/* Sticky header inside the scroll column */}
        <div className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b border-line/40 px-3 sm:px-6 py-3 flex items-center justify-between">
          {/* Mobile-only logo (desktop has it in the brand panel) */}
          <div className="lg:hidden">
            <Link href="/" className="inline-block">
              <Logo size="md" />
            </Link>
          </div>
          {/* Spacer so controls align to the end on desktop */}
          <div className="hidden lg:block" aria-hidden="true" />

          {/* LocaleSwitcher + ThemeToggle */}
          <div className="flex items-center gap-2 ms-auto">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Vertically centred form region — uses min-h to stay centred on
            tall screens but allows the card to grow on short ones */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-10 py-8">
          {/* Page heading (outside the card so it can breathe) */}
          <div className="w-full max-w-md mx-auto mb-6 space-y-1.5">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-muted leading-relaxed">{subtitle}</p>
          </div>

          {/* Form card */}
          <div className="w-full max-w-md mx-auto rounded-3xl bg-card border border-line p-5 sm:p-8 shadow-sm">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}
