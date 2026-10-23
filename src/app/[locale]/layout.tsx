import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { ThemeSync } from '@/components/shared/ThemeSync';
import { routing } from '@/i18n/routing';
import { readexPro, ibmPlexSansArabic } from '@/app/fonts';
import { ToastProvider } from '@/components/ui/toast';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'DoseMinder — تذكير ومتابعة الأدوية',
  description:
    'تطبيق ذكي لإدارة ومتابعة الأدوية لكبار السن وأسرهم مع عرض الجدول حتى بدون إنترنت.',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const themeInitScript = `
  (function() {
    try {
      var savedTheme = localStorage.getItem('doseminder-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = savedTheme === 'dark' || (savedTheme !== 'light' && prefersDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      var savedScale = localStorage.getItem('doseminder-font-scale');
      if (savedScale) {
        document.documentElement.setAttribute('data-font-scale', savedScale);
      }
      var savedContrast = localStorage.getItem('doseminder-high-contrast');
      if (savedContrast === 'true') {
        document.documentElement.setAttribute('data-high-contrast', 'true');
      }
    } catch (e) {}
  })();
`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'ar' | 'en')) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${readexPro.variable} ${ibmPlexSansArabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-body bg-paper text-ink min-h-screen antialiased selection:bg-primary-tint selection:text-primary-dark">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeSync />
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
