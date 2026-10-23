'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Globe } from 'lucide-react';

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale = currentLocale === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      aria-label={currentLocale === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
      title={currentLocale === 'ar' ? 'English' : 'العربية'}
      className="inline-flex h-[36px] md:h-[40px] shrink-0 items-center justify-center gap-1 rounded-full border border-line bg-card w-[36px] min-[380px]:w-auto min-[380px]:px-2.5 md:px-3 text-ink transition-colors hover:border-primary hover:text-primary cursor-pointer"
    >
      <Globe className="h-[18px] w-[18px]" />
      <span dir="ltr" className="hidden min-[380px]:inline font-heading text-xs font-semibold uppercase">
        {nextLocale}
      </span>
    </button>
  );
}
