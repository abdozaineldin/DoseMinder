'use client';

import * as React from 'react';
import { Eye } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';

function getHighContrastSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('doseminder-high-contrast') === 'true';
}

function subscribeHighContrast(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function HighContrastToggle() {
  const ar = useLocale() === 'ar';
  const highContrast = React.useSyncExternalStore(
    subscribeHighContrast,
    getHighContrastSnapshot,
    () => false
  );

  const toggle = () => {
    const next = !highContrast;
    localStorage.setItem('doseminder-high-contrast', next.toString());
    document.documentElement.setAttribute('data-high-contrast', next ? 'true' : 'false');
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <Button
      variant={highContrast ? 'primary' : 'outline'}
      size="sm"
      onClick={toggle}
      className="flex items-center gap-2 rounded-full px-3 py-1 font-heading text-sm font-semibold h-10"
      aria-pressed={highContrast}
      aria-label="Toggle high contrast"
    >
      <Eye className="w-3.5 h-3.5" />
      <span>{ar ? (highContrast ? 'التباين العالي: مفعّل' : 'تفعيل التباين العالي') : highContrast ? 'High contrast: on' : 'Turn on high contrast'}</span>
    </Button>
  );
}
