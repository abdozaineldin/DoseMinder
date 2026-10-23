'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

export type FontScale = 1 | 2 | 3;

function getFontScaleSnapshot(): FontScale {
  if (typeof window === 'undefined') return 1;
  const saved = localStorage.getItem('doseminder-font-scale');
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (parsed === 1 || parsed === 2 || parsed === 3) {
      return parsed as FontScale;
    }
  }
  return 1;
}

function subscribeFontScale(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function FontScaleControl() {
  const scale = React.useSyncExternalStore(subscribeFontScale, getFontScaleSnapshot, () => 1);

  const handleSelect = (s: FontScale) => {
    localStorage.setItem('doseminder-font-scale', s.toString());
    document.documentElement.setAttribute('data-font-scale', s.toString());
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div
      className="inline-flex items-center rounded-full bg-sand/60 p-1 border border-line/60"
      role="group"
      dir="ltr"
      aria-label="Text size control"
    >
      <Button
        variant={scale === 1 ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => handleSelect(1)}
        className="h-8 px-2.5 rounded-full text-xs font-bold font-heading"
        aria-label="Standard text size (A)"
        aria-pressed={scale === 1}
      >
        A
      </Button>
      <Button
        variant={scale === 2 ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => handleSelect(2)}
        className="h-8 px-2.5 rounded-full text-sm font-bold font-heading"
        aria-label="Large text size (A+)"
        aria-pressed={scale === 2}
      >
        A+
      </Button>
      <Button
        variant={scale === 3 ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => handleSelect(3)}
        className="h-8 px-2.5 rounded-full text-base font-bold font-heading"
        aria-label="Extra large text size (A++)"
        aria-pressed={scale === 3}
      >
        A++
      </Button>
    </div>
  );
}
