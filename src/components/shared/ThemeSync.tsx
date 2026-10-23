'use client';

import * as React from 'react';
import { THEME_KEY, applyTheme } from './ThemeToggle';

/** Re-applies the saved theme whenever the root layout (re)mounts, e.g. after
 *  a locale switch, and follows the OS theme while no explicit choice exists. */
export function ThemeSync() {
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(THEME_KEY);
      } catch {}
      const dark = saved === 'dark' || (saved !== 'light' && mq.matches);
      applyTheme(dark ? 'dark' : 'light');
    };
    try {
      const scale = localStorage.getItem('doseminder-font-scale');
      if (scale) document.documentElement.setAttribute('data-font-scale', scale);
      if (localStorage.getItem('doseminder-high-contrast') === 'true')
        document.documentElement.setAttribute('data-high-contrast', 'true');
    } catch {}
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return null;
}
