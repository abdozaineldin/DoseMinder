import { getTranslations } from 'next-intl/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SignOutButton } from '@/components/shared/SignOutButton';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'shells' });
  return {
    title: `${t('settings')} — DoseMinder`,
  };
}

export default async function DoctorSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tShells = await getTranslations({ locale, namespace: 'shells' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">
          {tShells('settingsTitle')}
        </h1>
        <p className="text-sm text-muted mt-1">
          {tShells('settings')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">حساب الطبيب المعالج</CardTitle>
          <CardDescription className="text-xs">
            {tShells('doctorRoleBadge')} · باطنة وقلب
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 border-t border-line">
          <SignOutButton variant="destructive" className="font-heading" />
        </CardContent>
      </Card>
    </div>
  );
}
