'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getHomeRouteForRole, isValidRole } from '@/lib/auth/role-routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Users, Stethoscope, Eye, EyeOff, AlertCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { UserRole } from '@/db/database.types';

export function RegisterForm() {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const isRtl = locale === 'ar';
  const NextIcon = isRtl ? ArrowLeft : ArrowRight;
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  // Initialize role from search param if valid
  const initialRole = searchParams.get('role');
  const [role, setRole] = React.useState<UserRole>(
    isValidRole(initialRole) ? initialRole : 'patient'
  );

  // If role was passed in URL, jump directly to step 2, otherwise start at step 1
  const [step, setStep] = React.useState<1 | 2>(initialRole && isValidRole(initialRole) ? 2 : 1);

  // Form Fields
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [specialty, setSpecialty] = React.useState('');
  const [preferredLocale, setPreferredLocale] = React.useState<'ar' | 'en'>(
    locale === 'en' ? 'en' : 'ar'
  );

  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError(tAuth('fullName') + ' ' + tCommon('error'));
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError(tAuth('email') + ' ' + tCommon('error'));
      return;
    }

    if (password.length < 8) {
      setError(tAuth('passwordHint'));
      return;
    }

    if (role === 'doctor' && !specialty.trim()) {
      setError(tAuth('specialty') + ' ' + tCommon('error'));
      return;
    }

    // Fix E: detect placeholder / unconfigured Supabase URL before hitting the network
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    if (!supabaseUrl || supabaseUrl.includes('placeholder.supabase.co')) {
      setError(tAuth('notConfigured'));
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            specialty: role === 'doctor' ? specialty.trim() : null,
            locale: preferredLocale,
          },
        },
      });

      if (signUpError) {
        if (
          signUpError.message.toLowerCase().includes('already registered') ||
          signUpError.message.toLowerCase().includes('duplicate') ||
          signUpError.status === 422
        ) {
          setError(tAuth('emailAlreadyRegistered'));
        } else {
          setError(signUpError.message || tCommon('error'));
        }
        setLoading(false);
        return;
      }

      // Successful registration: redirect to role home
      const targetRoute = getHomeRouteForRole(role);
      router.push(targetRoute);
    } catch (err) {
      // TypeError usually means a network failure (e.g. unreachable host)
      if (err instanceof TypeError) {
        setError(tAuth('notConfigured'));
      } else {
        setError(tCommon('error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-line text-xs font-semibold text-muted">
        <span className={step === 1 ? 'text-primary font-bold' : ''}>
          1. {tAuth('roleStepTitle')}
        </span>
        <span>•</span>
        <span className={step === 2 ? 'text-primary font-bold' : ''}>
          2. {tAuth('registerTitle')}
        </span>
      </div>

      {/* Inline Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3.5 rounded-2xl bg-missed/10 border border-missed/30 text-missed text-sm font-medium mb-6"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Step 1: Role Selection */}
      {/* ------------------------------------------------------------------- */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted mb-2">{tAuth('roleStepDesc')}</p>

          {/* Patient Card */}
          <button
            type="button"
            onClick={() => handleRoleSelect('patient')}
            className={`w-full p-4.5 rounded-2xl border-2 text-start transition-all cursor-pointer flex items-start gap-4 ${
              role === 'patient'
                ? 'border-primary bg-primary-tint/30 shadow-xs'
                : 'border-line hover:border-primary/40 bg-card'
            }`}
          >
            <div className="p-3 rounded-xl bg-primary-tint text-primary shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-ink">
                  {tAuth('rolePatient')}
                </h3>
                {role === 'patient' && <Check className="w-5 h-5 text-primary" />}
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {tAuth('rolePatientDesc')}
              </p>
            </div>
          </button>

          {/* Caregiver Card */}
          <button
            type="button"
            onClick={() => handleRoleSelect('caregiver')}
            className={`w-full p-4.5 rounded-2xl border-2 text-start transition-all cursor-pointer flex items-start gap-4 ${
              role === 'caregiver'
                ? 'border-saffron bg-saffron-tint/30 shadow-xs'
                : 'border-line hover:border-saffron/40 bg-card'
            }`}
          >
            <div className="p-3 rounded-xl bg-saffron-tint/60 text-ink shrink-0">
              <Users className="w-6 h-6 text-saffron" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-ink">
                  {tAuth('roleCaregiver')}
                </h3>
                {role === 'caregiver' && <Check className="w-5 h-5 text-saffron" />}
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {tAuth('roleCaregiverDesc')}
              </p>
            </div>
          </button>

          {/* Doctor Card */}
          <button
            type="button"
            onClick={() => handleRoleSelect('doctor')}
            className={`w-full p-4.5 rounded-2xl border-2 text-start transition-all cursor-pointer flex items-start gap-4 ${
              role === 'doctor'
                ? 'border-primary-dark bg-primary-tint/50 shadow-xs'
                : 'border-line hover:border-primary-dark/40 bg-card'
            }`}
          >
            <div className="p-3 rounded-xl bg-primary-tint text-primary-dark shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base text-ink">
                  {tAuth('roleDoctor')}
                </h3>
                {role === 'doctor' && <Check className="w-5 h-5 text-primary-dark" />}
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {tAuth('roleDoctorDesc')}
              </p>
            </div>
          </button>

          <Button
            type="button"
            onClick={() => setStep(2)}
            className="w-full h-13 font-heading font-bold text-base gap-2 mt-4"
          >
            <span>{tAuth('stepNext')}</span>
            <NextIcon className="w-4 h-4" />
          </Button>

          <div className="text-center text-sm text-muted pt-2">
            <span>{tAuth('hasAccountPrompt')} </span>
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary-dark underline underline-offset-4 transition-colors"
            >
              {tAuth('loginTitle')}
            </Link>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Step 2: Form Details */}
      {/* ------------------------------------------------------------------- */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Back to Step 1 Button */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary transition-colors mb-2 cursor-pointer"
          >
            <BackIcon className="w-4 h-4" />
            <span>{tAuth('stepBack')} ({tAuth('roleStepTitle')})</span>
          </button>

          {/* Full Name */}
          <div className="space-y-1">
            <label htmlFor="reg-fullname" className="block text-sm font-semibold text-ink">
              {tAuth('fullName')}
            </label>
            <Input
              id="reg-fullname"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={tAuth('fullNamePlaceholder')}
              className="h-11 text-base"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="reg-email" className="block text-sm font-semibold text-ink">
              {tAuth('email')}
            </label>
            <Input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tAuth('emailPlaceholder')}
              dir="ltr"
              className="h-11 text-start font-mono text-base"
            />
          </div>

          {/* Password with Strength Hint */}
          <div className="space-y-1">
            <label htmlFor="reg-password" className="block text-sm font-semibold text-ink">
              {tAuth('password')}
            </label>
            <div className="relative">
              <Input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tAuth('passwordPlaceholder')}
                dir="ltr"
                className="h-11 pr-12 text-start font-mono text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? tAuth('hidePassword') : tAuth('showPassword')}
                className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 text-muted hover:text-ink transition-colors rounded-lg"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-muted">{tAuth('passwordHint')}</p>
          </div>

          {/* Optional Phone */}
          <div className="space-y-1">
            <label htmlFor="reg-phone" className="block text-sm font-semibold text-ink">
              {tAuth('phone')}
            </label>
            <Input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={tAuth('phonePlaceholder')}
              dir="ltr"
              className="h-11 text-start font-mono text-base"
            />
          </div>

          {/* Doctor Specialty (Conditioned on Doctor Role) */}
          {role === 'doctor' && (
            <div className="space-y-1">
              <label htmlFor="reg-specialty" className="block text-sm font-semibold text-ink">
                {tAuth('specialty')}
              </label>
              <Input
                id="reg-specialty"
                type="text"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder={tAuth('specialtyPlaceholder')}
                className="h-11 text-base"
              />
            </div>
          )}

          {/* Preferred Language */}
          <div className="space-y-1">
            <label htmlFor="reg-locale" className="block text-sm font-semibold text-ink">
              {tAuth('preferredLanguage')}
            </label>
            <select
              id="reg-locale"
              value={preferredLocale}
              onChange={(e) => setPreferredLocale(e.target.value as 'ar' | 'en')}
              className="w-full h-11 px-3.5 rounded-xl border border-line bg-card text-ink text-sm font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="ar">العربية (Arabic - RTL)</option>
              <option value="en">English (LTR)</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-13 font-heading font-bold text-base shadow-md mt-4"
          >
            {loading ? tCommon('loading') : tAuth('registerTitle')}
          </Button>

          <div className="text-center text-sm text-muted pt-2">
            <span>{tAuth('hasAccountPrompt')} </span>
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary-dark underline underline-offset-4 transition-colors"
            >
              {tAuth('loginTitle')}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
