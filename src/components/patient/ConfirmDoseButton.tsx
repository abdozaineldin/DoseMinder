'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export function ConfirmDoseButton({
  doseId,
  variant = 'big',
  late = false,
}: {
  doseId: string;
  variant?: 'big' | 'compact';
  /** true for a dose already marked missed — late confirmation is allowed (SPEC §3.3). */
  late?: boolean;
}) {
  const t = useTranslations('common');
  const tp = useTranslations('patient');
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const onClick = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc('confirm_dose', {
      p_dose_id: doseId,
      p_taken_at: new Date().toISOString(),
      p_offline: false,
    });
    setLoading(false);
    if (error) {
      toast({ title: t('error'), message: tp('confirmError'), type: 'error' });
      return;
    }
    toast({ title: t('all_good'), message: tp('confirmedToast'), type: 'success' });
    router.refresh();
  };

  if (variant === 'compact') {
    return (
      <Button type="button" size="sm" variant="outline" onClick={onClick} disabled={loading} className="h-10 gap-1.5">
        <Check className="w-4 h-4" />
        <span>{late ? tp('confirmLate') : t('taken_button')}</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="big-taken"
      onClick={onClick}
      disabled={loading}
      className="w-full bg-primary hover:bg-primary-dark text-white font-heading font-bold text-xl gap-3 shadow-md"
    >
      <Check className="w-6 h-6 stroke-[3]" />
      <span>{loading ? t('loading') : t('taken_button')}</span>
    </Button>
  );
}
