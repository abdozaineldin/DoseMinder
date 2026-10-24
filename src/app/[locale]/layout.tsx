import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { ThemeSync } from '@/components/shared/ThemeSync';
import { SplashScreen } from '@/components/shared/SplashScreen';
import { routing } from '@/i18n/routing';
import { readexPro, ibmPlexSansArabic } from '@/app/fonts';
import { ToastProvider } from '@/components/ui/toast';
import '@/app/globals.css';

export const metadata = {
  title: "DoseMinder – تذكير ومتابعة الأدوية",
  description:
    "منصة لإدارة مواعيد الأدوية ومتابعة الجرعات، تساعد كبار السن وأسرهم ومقدمي الرعاية على الالتزام بالعلاج.",
  openGraph: {
    title: "DoseMinder – تذكير ومتابعة الأدوية",
    description:
      "تذكير ذكي بالأدوية ومتابعة الجرعات لراحة المرضى وأسرهم.",
    url: "https://doseminder.vercel.app/",
    siteName: "DoseMinder",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DoseMinder - Medication reminders",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DoseMinder – تذكير ومتابعة الأدوية",
    description: "تذكير ذكي بالأدوية ومتابعة الجرعات.",
    images: ["/og-image.png"],
  },
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

/* Decides before first paint whether the splash screen should play:
 * once per browser tab session, and never for reduced-motion users. */
const splashInitScript = `
  (function() {
    var root = document.documentElement;
    try {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      root.setAttribute('data-splash', reduce ? 'skip' : 'on');
    } catch (e) {
      root.setAttribute('data-splash', 'skip');
    }
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
        <script dangerouslySetInnerHTML={{ __html: splashInitScript }} />
        <noscript>
          <style>{`.dm-splash{display:none!important}`}</style>
        </noscript>
      </head>
      <body className="font-body bg-paper text-ink min-h-screen antialiased selection:bg-primary-tint selection:text-primary-dark">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeSync />
          <SplashScreen />
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
