'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { getHomeRouteForRole, isValidRole } from '@/lib/auth/role-routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { UserRole } from '@/db/database.types';

export function LoginForm() {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(tAuth('invalidCredentials'));
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(tAuth('invalidCredentials'));
        setLoading(false);
        return;
      }

      const user = data.user;
      let userRole: UserRole = 'patient';

      // Query profiles table for verified role only (never trust user_metadata)
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const typedProfile = profile as { role?: unknown } | null;
        if (typedProfile && isValidRole(typedProfile.role)) {
          userRole = typedProfile.role;
        }
      }

      const targetRoute = getHomeRouteForRole(userRole);
      router.push(targetRoute);
    } catch {
      setError(tAuth('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Inline Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3.5 rounded-2xl bg-missed/10 border border-missed/30 text-missed text-sm font-medium"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <label htmlFor="login-email" className="block text-sm font-semibold text-ink">
          {tAuth('email')}
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={tAuth('emailPlaceholder')}
          dir="ltr"
          className="h-12 text-start font-mono text-base"
        />
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="block text-sm font-semibold text-ink">
            {tAuth('password')}
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
          >
            {tAuth('forgotPasswordLink')}
          </Link>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={tAuth('passwordPlaceholder')}
            dir="ltr"
            className="h-12 pr-12 text-start font-mono text-base"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? tAuth('hidePassword') : tAuth('showPassword')}
            className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 text-muted hover:text-ink transition-colors rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-13 font-heading font-bold text-base shadow-md mt-2"
      >
        {loading ? tCommon('loading') : tAuth('loginTitle')}
      </Button>

      {/* Link to Register */}
      <div className="text-center text-sm text-muted pt-2">
        <span>{tAuth('noAccountPrompt')} </span>
        <Link
          href="/register"
          className="font-semibold text-primary hover:text-primary-dark underline underline-offset-4 transition-colors"
        >
          {tAuth('registerTitle')}
        </Link>
      </div>
    </form>
  );
}
