import { Readex_Pro, IBM_Plex_Sans_Arabic } from 'next/font/google';

export const readexPro = Readex_Pro({
  subsets: ['arabic', 'latin'],
  weight: ['500', '600', '700'],
  variable: '--font-readex-pro',
  display: 'swap',
});

export const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-sans-arabic',
  display: 'swap',
});
