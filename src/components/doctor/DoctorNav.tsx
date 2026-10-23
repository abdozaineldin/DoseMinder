'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { UserCheck, Settings } from 'lucide-react';

export function DoctorNav() {
  const tShells = useTranslations('shells');
  const pathname = usePathname();

  const navItems = [
    {
      href: '/doctor/patients',
      label: tShells('patients'),
      icon: UserCheck,
      active: pathname.startsWith('/doctor/patients'),
    },
    {
      href: '/doctor/settings',
      label: tShells('settings'),
      icon: Settings,
      active: pathname.startsWith('/doctor/settings'),
    },
  ];

  return (
    <>
      {/* Mobile Bar */}
      <nav
        aria-label="Doctor navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-line shadow-lg pb-safe"
      >
        <div className="grid grid-cols-2 h-16 max-w-sm mx-auto px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-all select-none min-h-[48px]',
                  item.active ? 'text-primary font-bold' : 'text-muted hover:text-ink'
                )}
              >
                <Icon className={cn('w-5 h-5', item.active && 'stroke-[2.5]')} />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-e border-line bg-card/60 p-6 space-y-6">
        <div className="text-xs font-semibold text-muted tracking-wider uppercase px-3">
          {tShells('doctorRoleBadge')}
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
