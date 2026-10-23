'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { Sun, Moon } from 'lucide-react';

/** Stored preference. The toggle only ever writes 'light' or 'dark';
 *  'system' (no explicit choice yet) is resolved by the head script. */
export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_KEY = 'doseminder-theme';

/** Resolved theme = what the page is actually showing right now. */
function getResolvedSnapshot(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function subscribeResolved(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme'],
  });
  return () => observer.disconnect();
}

export function applyTheme(mode: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.setAttribute('data-theme', mode);
}

export function ThemeToggle() {
  const locale = useLocale();
  const resolved = React.useSyncExternalStore(
    subscribeResolved,
    getResolvedSnapshot,
    () => 'light' as const
  );

  const next = resolved === 'dark' ? 'light' : 'dark';

  const handleClick = () => {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable — still apply for this session */
    }
    applyTheme(next);
  };

  const label =
    locale === 'ar'
      ? next === 'dark'
        ? 'تفعيل الوضع الداكن'
        : 'تفعيل الوضع الفاتح'
      : next === 'dark'
        ? 'Switch to dark mode'
        : 'Switch to light mode';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="inline-flex h-[36px] w-[36px] md:h-[40px] md:w-[40px] shrink-0 items-center justify-center rounded-full border border-line bg-card text-ink transition-colors hover:border-primary hover:text-primary cursor-pointer"
    >
      {resolved === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
