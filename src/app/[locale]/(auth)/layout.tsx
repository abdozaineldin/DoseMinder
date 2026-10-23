import * as React from 'react';
import { protectGuestRoute } from '@/lib/auth/route-guard';

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await protectGuestRoute(locale);

  return <>{children}</>;
}
