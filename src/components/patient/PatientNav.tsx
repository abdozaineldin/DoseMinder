'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Calendar, Pill, History, User } from 'lucide-react';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PatientNav() {
  const tNav = useTranslations('nav');
  const pathname = usePathname();

  const navItems = [
    {
      href: '/patient/today',
      label: tNav('today'),
      icon: Calendar,
      active: isActive(pathname, '/patient/today'),
    },
    {
      href: '/patient/medications',
      label: tNav('medications'),
      icon: Pill,
      active: isActive(pathname, '/patient/medications'),
    },
    {
      href: '/patient/history',
      label: tNav('history'),
      icon: History,
      active: isActive(pathname, '/patient/history'),
    },
    {
      href: '/patient/me',
      label: tNav('me'),
      icon: User,
      active: isActive(pathname, '/patient/me'),
    },
  ];

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* 1. Mobile Bottom Navigation (4 large tabs, min 56px touch target) */}
      {/* ----------------------------------------------------------------- */}
      <nav
        aria-label="Patient navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-line shadow-lg pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 h-18 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-all min-h-[56px] select-none rounded-xl active:scale-95',
                  item.active
                    ? 'text-primary font-bold'
                    : 'text-muted hover:text-ink'
                )}
              >
                <div
                  className={cn(
                    'p-1.5 rounded-full transition-colors',
                    item.active && 'bg-primary-tint'
                  )}
                >
                  <Icon className={cn('w-6 h-6', item.active && 'stroke-[2.5]')} />
                </div>
                <span className="text-xs tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Desktop Sidebar Navigation (≥ 1024px)                          */}
      {/* ----------------------------------------------------------------- */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-e border-line bg-card/60 p-6 space-y-6">
        <div className="text-xs font-semibold text-muted tracking-wider uppercase px-3">
          {tNav('menu')}
        </div>

        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-base font-medium transition-all select-none',
                  item.active
                    ? 'bg-primary text-white font-bold shadow-xs'
                    : 'text-muted hover:text-ink hover:bg-sand/60'
                )}
              >
                <Icon className={cn('w-5 h-5 shrink-0', item.active && 'stroke-[2.5]')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
