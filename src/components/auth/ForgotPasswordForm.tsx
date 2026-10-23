'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');

  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError(tAuth('email') + ' ' + tCommon('error'));
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message || tCommon('error'));
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError(tCommon('error'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-taken/15 text-taken flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-bold text-lg text-ink">
          {tAuth('resetLinkSent')}
        </h3>
        <p className="text-xs text-muted">
          {tAuth('forgotPasswordDesc')}
        </p>
        <Link href="/login" className="inline-block pt-2">
          <Button variant="outline" className="font-heading">
            {tAuth('backToLogin')}
          </Button>
        </Link>
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
        <label htmlFor="forgot-email" className="block text-sm font-semibold text-ink">
          {tAuth('email')}
        </label>
        <Input
          id="forgot-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={tAuth('emailPlaceholder')}
          dir="ltr"
          className="h-12 text-start font-mono text-base"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-13 font-heading font-bold text-base shadow-md mt-2"
      >
        {loading ? tCommon('loading') : tAuth('sendResetLink')}
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
