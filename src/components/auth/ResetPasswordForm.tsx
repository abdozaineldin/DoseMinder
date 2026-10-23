'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function ResetPasswordForm() {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(tAuth('passwordHint'));
      return;
    }

    if (password !== confirmPassword) {
      setError(tAuth('passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || tCommon('error'));
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      setError(tCommon('error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-taken/15 text-taken flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-bold text-lg text-ink">
          {tAuth('passwordUpdated')}
        </h3>
        <p className="text-xs text-muted">
          {tAuth('loginSuccess')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3.5 rounded-2xl bg-missed/10 border border-missed/30 text-missed text-sm font-medium"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="reset-pass" className="block text-sm font-semibold text-ink">
          {tAuth('newPassword')}
        </label>
        <Input
          id="reset-pass"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={tAuth('passwordPlaceholder')}
          dir="ltr"
          className="h-12 text-start font-mono text-base"
        />
        <p className="text-xs text-muted">{tAuth('passwordHint')}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reset-confirm" className="block text-sm font-semibold text-ink">
          {tAuth('confirmPassword')}
        </label>
        <Input
          id="reset-confirm"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={tAuth('passwordPlaceholder')}
          dir="ltr"
          className="h-12 text-start font-mono text-base"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-13 font-heading font-bold text-base shadow-md mt-2"
      >
        {loading ? tCommon('loading') : tAuth('updatePassword')}
      </Button>

      <div className="text-center text-sm text-muted pt-2">
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          ← {tAuth('backToLogin')}
        </Link>
      </div>
    </form>
  );
}
