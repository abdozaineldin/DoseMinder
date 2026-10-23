'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Logo } from '@/components/shared/Logo';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { PhoneMockup } from '@/components/shared/PhoneMockup';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Heart,
  Users,
  Stethoscope,
  PlusCircle,
  BellRing,
  ShieldCheck,
  Languages,
  WifiOff,
  Volume2,
  Lock,
  Maximize2,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function LandingPage() { 
  const tLanding = useTranslations('landing');
  const tNav = useTranslations('nav');
  const tApp = useTranslations('app');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-primary-tint selection:text-primary-dark">
      {/* --------------------------------------------------------------------- */}
      {/* 1. Sticky Navigation Header */}
      {/* --------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-paper/90 border-b border-line/60 transition-colors">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 md:h-18 flex items-center justify-between gap-2">
          <Link href="/" className="focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1">
            <Logo size="md" />
          </Link>

          {/* Controls & CTA buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            <Link href="/login">
              <Button size="sm" className="h-[36px] md:h-[40px] min-h-0 px-2 min-[360px]:px-2.5 sm:px-4 text-xs min-[360px]:text-[13px] sm:text-sm font-heading font-semibold shadow-xs">
                {tLanding('login')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* --------------------------------------------------------------------- */}
        {/* 2. Hero Section */}
        {/* --------------------------------------------------------------------- */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
          {/* Subtle Background SVG Blobs */}
          <div
            aria-hidden="true"
            className="absolute top-10 start-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary-tint/40 dark:bg-primary-tint/10 blur-3xl rounded-full pointer-events-none -z-10"
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Hero Copy (Text Column) */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-tint text-primary text-xs font-semibold select-none border border-primary/20">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{tApp('name')} — {tApp('tagline')}</span>
                </div>

                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.15]">
                  {tLanding('heroTitle')}
                </h1>

                <p className="text-lg sm:text-xl text-muted leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {tLanding('heroSubtitle')}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                  <Link href="/register" className="w-full sm:w-auto">
                    <Button size="xl" className="w-full sm:w-auto font-heading text-lg font-bold gap-2 shadow-md">
                      <span>{tLanding('getStarted')}</span>
                      <ArrowIcon className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button variant="outline" size="xl" className="w-full sm:w-auto font-heading text-lg">
                      {tLanding('login')}
                    </Button>
                  </Link>
                </div>

                {/* Value Tags */}
                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-muted font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-taken" />
                    {tLanding('feature2Title')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {tLanding('feature4Title')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-saffron" />
                    {tLanding('feature3Title')}
                  </span>
                </div>
              </div>

              {/* HTML/SVG Realistic Phone Mockup */}
              <div className="lg:col-span-5 flex justify-center">
                <PhoneMockup />
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 3. Three Role Cards Section */}
        {/* --------------------------------------------------------------------- */}
        <section id="roles" className="py-16 md:py-24 bg-sand/30 border-y border-line/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink">
                {tLanding('rolesTitle')}
              </h2>
              <p className="text-muted text-base sm:text-lg">
                {tLanding('rolesSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Patient Card */}
              <Card className="flex flex-col justify-between border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-tint text-primary flex items-center justify-center">
                    <Heart className="w-7 h-7" />
                  </div>
                  <CardTitle className="font-heading text-2xl">
                    {tLanding('patientRoleTitle')}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {tLanding('patientRoleDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Link href="/register?role=patient" className="w-full">
                    <Button variant="default" className="w-full font-heading justify-between">
                      <span>{tLanding('patientRoleAction')}</span>
                      <ArrowIcon className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Caregiver Card */}
              <Card className="flex flex-col justify-between border-saffron/30 hover:border-saffron transition-all hover:shadow-lg">
                <CardHeader className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-saffron-tint/60 text-ink flex items-center justify-center">
                    <Users className="w-7 h-7 text-saffron" />
                  </div>
                  <CardTitle className="font-heading text-2xl">
                    {tLanding('caregiverRoleTitle')}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {tLanding('caregiverRoleDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Link href="/register?role=caregiver" className="w-full">
                    <Button variant="outline" className="w-full font-heading justify-between border-line hover:border-primary">
                      <span>{tLanding('caregiverRoleAction')}</span>
                      <ArrowIcon className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Doctor Card */}
              <Card className="flex flex-col justify-between border-primary-dark/20 hover:border-primary-dark transition-all hover:shadow-lg">
                <CardHeader className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-tint/80 text-primary-dark flex items-center justify-center">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <CardTitle className="font-heading text-2xl">
                    {tLanding('doctorRoleTitle')}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {tLanding('doctorRoleDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Link href="/register?role=doctor" className="w-full">
                    <Button variant="outline" className="w-full font-heading justify-between border-line hover:border-primary">
                      <span>{tLanding('doctorRoleAction')}</span>
                      <ArrowIcon className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 4. How It Works (3 Steps) */}
        {/* --------------------------------------------------------------------- */}
        <section id="how-it-works" className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink">
                {tLanding('howItWorks')}
              </h2>
              <p className="text-muted text-base sm:text-lg">
                {tLanding('featuresSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="relative p-6 rounded-3xl bg-card border border-line shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-primary-tint text-primary flex items-center justify-center">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <span
                    dir="ltr"
                    style={{ unicodeBidi: 'isolate' }}
                    className="font-heading font-bold text-3xl text-line select-none"
                  >
                    01
                  </span>
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">
                  {tLanding('step1Title')}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {tLanding('step1Desc')}
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative p-6 rounded-3xl bg-card border border-line shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-saffron/20 text-ink flex items-center justify-center">
                    <BellRing className="w-6 h-6 text-saffron" />
                  </div>
                  <span
                    dir="ltr"
                    style={{ unicodeBidi: 'isolate' }}
                    className="font-heading font-bold text-3xl text-line select-none"
                  >
                    02
                  </span>
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">
                  {tLanding('step2Title')}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {tLanding('step2Desc')}
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative p-6 rounded-3xl bg-card border border-line shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-taken/20 text-taken flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span
                    dir="ltr"
                    style={{ unicodeBidi: 'isolate' }}
                    className="font-heading font-bold text-3xl text-line select-none"
                  >
                    03
                  </span>
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">
                  {tLanding('step3Title')}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {tLanding('step3Desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 5. Escalation Strip Section */}
        {/* --------------------------------------------------------------------- */}
        <section id="escalation" className="py-16 md:py-24 bg-gradient-to-b from-sand/20 to-paper border-y border-line/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-missed/10 text-missed text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{tLanding('escalationBadge')}</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink">
                {tLanding('escalationTitle')}
              </h2>
              <p className="text-muted text-base sm:text-lg">
                {tLanding('escalationSubtitle')}
              </p>
            </div>

            {/* Stepper Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {/* Stage 1 */}
              <div className="p-4 rounded-2xl bg-card border border-line text-center space-y-2 shadow-xs">
                <div className="w-10 h-10 mx-auto rounded-full bg-primary-tint text-primary flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-sand text-muted">
                  T = 0 min
                </span>
                <h4 className="font-heading font-bold text-sm text-ink">{tLanding('escalationStep1')}</h4>
                <p className="text-xs text-muted">{tLanding('escalationStep1Desc')}</p>
              </div>

              {/* Stage 2 */}
              <div className="p-4 rounded-2xl bg-card border border-saffron/30 text-center space-y-2 shadow-xs">
                <div className="w-10 h-10 mx-auto rounded-full bg-saffron/20 text-saffron flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-saffron-tint text-ink">
                  T + 30 min
                </span>
                <h4 className="font-heading font-bold text-sm text-ink">{tLanding('escalationStep2')}</h4>
                <p className="text-xs text-muted">{tLanding('escalationStep2Desc')}</p>
              </div>

              {/* Stage 3 */}
              <div className="p-4 rounded-2xl bg-card border border-missed/30 text-center space-y-2 shadow-xs">
                <div className="w-10 h-10 mx-auto rounded-full bg-missed/20 text-missed flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <span className="inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-missed-tint text-missed font-medium">
                  T + 30 min
                </span>
                <h4 className="font-heading font-bold text-sm text-ink">{tLanding('escalationStep3')}</h4>
                <p className="text-xs text-muted">{tLanding('escalationStep3Desc')}</p>
              </div>

              {/* Stage 4 */}
              <div className="p-4 rounded-2xl bg-card border border-missed/30 text-center space-y-2 shadow-xs">
                <div className="w-10 h-10 mx-auto rounded-full bg-missed/20 text-missed flex items-center justify-center font-bold">
                  <BellRing className="w-5 h-5" />
                </div>
                <span className="inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-missed-tint text-missed font-medium">
                  T + 45 / 60 min
                </span>
                <h4 className="font-heading font-bold text-sm text-ink">{tLanding('escalationStep4')}</h4>
                <p className="text-xs text-muted">{tLanding('escalationStep4Desc')}</p>
              </div>

              {/* Stage 5 */}
              <div className="p-4 rounded-2xl bg-card border border-emergency/40 bg-emergency-tint/20 text-center space-y-2 shadow-xs">
                <div className="w-10 h-10 mx-auto rounded-full bg-emergency text-white flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emergency/15 text-emergency font-bold">
                  T + 75 min
                </span>
                <h4 className="font-heading font-bold text-sm text-emergency">{tLanding('escalationStep5')}</h4>
                <p className="text-xs text-muted">{tLanding('escalationStep5Desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------------- */}
        {/* 6. Features Grid (6 Cards) */}
        {/* --------------------------------------------------------------------- */}
        <section id="features" className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink">
                {tLanding('featuresTitle')}
              </h2>
              <p className="text-muted text-base sm:text-lg">
                {tLanding('featuresSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-3xl bg-card border border-line shadow-xs space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-primary-tint text-primary flex items-center justify-center">
                  <Languages className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">
                  {tLanding('feature1Title')}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {tLanding('feature1Desc')}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-3xl bg-card border border-line shadow-xs space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-primary-tint text-primary flex items-center justify-center">
                  <WifiOff className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">
                  {tLanding('feature2Title')}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {tLanding('feature2Desc')}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-3xl bg-card border border-line shadow-xs space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-primary-tint text-primary flex items-center justify-center">
                  <Volume2 className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">
                  {tLanding('feature3Title')}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {tLanding('feature3Desc')}
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-3xl bg-card border border-line shadow-xs space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-primary-tint text-primary flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">
                  {tLanding('feature4Title')}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {tLanding('feature4Desc')}
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-3xl bg-card border border-line shadow-xs space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-primary-tint text-primary flex items-center justify-center">
                  <Maximize2 className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">
                  {tLanding('feature5Title')}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {tLanding('feature5Desc')}
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-3xl bg-card border border-line shadow-xs space-y-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-primary-tint text-primary flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">
                  {tLanding('feature6Title')}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {tLanding('feature6Desc')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --------------------------------------------------------------------- */}
      {/* 7. Footer */}
      {/* --------------------------------------------------------------------- */}
      <footer className="bg-sand/40 border-t border-line/60 pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Logo size="md" />
            <div className="flex items-center gap-6 text-sm text-muted">
              <Link href="/login" className="hover:text-primary transition-colors">
                {tLanding('login')}
              </Link>
              <Link href="/register" className="hover:text-primary transition-colors">
                {tLanding('getStarted')}
              </Link>
              <Link href="/accessibility" className="hover:text-primary transition-colors">
                {tNav('accessibility')}
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary-tint/40 border border-primary/10 text-xs text-muted text-center leading-relaxed">
            {tLanding('footerMedical')}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted pt-4 border-t border-line/40">
            <p>
              <bdi dir="ltr" style={{ unicodeBidi: 'isolate' }}>© {currentYear} DoseMinder.</bdi>{' '}
              {tLanding('footerRights')}
            </p>
            <div className="flex items-center gap-4">
              <span>{tLanding('footerPrivacy')}</span>
              <span>·</span>
              <span>{tLanding('footerTerms')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
