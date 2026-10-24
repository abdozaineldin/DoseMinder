'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Copy, RefreshCw } from 'lucide-react';

export function ShareCodeCard({ code: initialCode }: { code: string }) {
  const t = useTranslations('patient');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [code, setCode] = React.useState(initialCode);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: tCommon('all_good'), message: t('codeCopied'), type: 'success' });
    } catch {
      toast({ title: tCommon('error'), message: code, type: 'info' });
    }
  };

  const regenerate = async () => {
    setBusy(true);
    const supabase = createClient() as unknown as {
      rpc: (fn: string) => Promise<{ data: string | null; error: unknown }>;
    };
    const { data, error } = await supabase.rpc('regenerate_share_code');
    setBusy(false);
    setConfirmOpen(false);
    if (error || !data) {
      toast({ title: tCommon('error'), message: tCommon('retry'), type: 'error' });
      return;
    }
    setCode(data);
    toast({ title: tCommon('all_good'), message: t('codeRegenerated'), type: 'success' });
    router.refresh();
  };

  return (
    <div className="rounded-2xl bg-sand/50 border border-line p-4 space-y-3">
      <div>
        <p className="text-xs font-semibold text-muted">{t('shareCode')}</p>
        <p dir="ltr" className="text-start font-mono font-bold text-2xl text-primary tracking-wider mt-1">
          {code}
        </p>
        <p className="text-xs text-muted mt-2">{t('shareCodeHint')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-1.5">
          <Copy className="w-4 h-4" />
          {t('copyCode')}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirmOpen(true)} className="gap-1.5">
          <RefreshCw className="w-4 h-4" />
          {t('regenerateCode')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('regenerateConfirmTitle')}
        description={t('regenerateConfirmDesc')}
        confirmLabel={busy ? t('regenerating') : t('regenerateCode')}
        variant="destructive"
        loading={busy}
        onConfirm={regenerate}
      />
    </div>
  );
}
