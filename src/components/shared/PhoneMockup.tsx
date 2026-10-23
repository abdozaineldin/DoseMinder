'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { DoseRing } from './DoseRing';
import { PillIcon } from './PillIcon';
import { StatusChip } from './StatusChip';
import { Check, Volume2, Shield } from 'lucide-react';

export function PhoneMockup({ className }: { className?: string }) {
  const tLanding = useTranslations('landing');
  const tCommon = useTranslations('common');

  const [confirmed, setConfirmed] = React.useState(false);

  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[320px] sm:max-w-[370px] select-none perspective-[1000px]',
        className
      )}
    >
      {/* Outer Phone Shell */}
      <div className="relative rounded-[48px] p-3.5 bg-gradient-to-b from-[#1E3A3D] to-[#0A1A1C] shadow-[0_25px_60px_-15px_rgba(15,107,112,0.35),0_0_0_1px_rgba(255,255,255,0.1)] border-4 border-[#2D5357]">
        {/* Top Speaker / Dynamic Island */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#0A1A1C] rounded-full z-20 flex items-center justify-between px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
          <div className="w-10 h-1 bg-[#223F42] rounded-full" />
        </div>

        {/* Screen Bezel */}
        <div className="relative overflow-hidden rounded-[38px] bg-paper border border-line/40 text-ink shadow-inner">
          {/* Mockup Status Bar */}
          <div className="pt-3 pb-2 px-6 flex items-center justify-between text-xs text-muted font-medium font-mono">
            <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>08:00</span>
            <div className="flex items-center gap-1.5 text-primary text-[10px]">
              <Shield className="w-3.5 h-3.5 text-taken" />
              <span className="sr-only">{tLanding('mockupOffline')}</span>
            </div>
          </div>

          {/* Time of Day Header (Dawn/Day Gradient) */}
          <div className="px-5 pt-3 pb-4 bg-gradient-to-b from-primary-tint/60 to-paper border-b border-line/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted font-medium">{tLanding('mockupGreeting')}</p>
                <h3 className="font-heading font-bold text-lg text-primary-dark">
                  {tLanding('mockupTime')}
                </h3>
              </div>
              <StatusChip status={confirmed ? 'taken' : 'due_now'} size="sm" />
            </div>
          </div>

          {/* Screen Content Body */}
          <div className="p-4 space-y-4">
            {/* Live Animated Dose Ring */}
            <div className="flex items-center justify-center py-2">
              <DoseRing
                size={130}
                strokeWidth={11}
                segments={[
                  { status: 'taken' },
                  { status: confirmed ? 'taken' : 'due' },
                  { status: 'upcoming' },
                ]}
                centerText={confirmed ? '2/3' : '1/3'}
                subText={tLanding('mockupTakenCount')}
              />
            </div>

            {/* Next Dose Card */}
            <div className="rounded-2xl bg-card p-4 border border-line shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-primary-tint text-primary shrink-0">
                  <PillIcon form="capsule" color="var(--primary)" size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4
                      dir="ltr"
                      style={{ unicodeBidi: 'isolate' }}
                      className="font-heading font-bold text-base text-ink"
                    >
                      {tLanding('mockupDoseName')}
                    </h4>
                    <button
                      type="button"
                      aria-label={tCommon('listen')}
                      className="p-1 rounded-full text-muted hover:text-primary transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{tLanding('mockupDoseRule')}</p>
                </div>
              </div>

              {/* Big Taken Button in Card */}
              <button
                type="button"
                onClick={() => setConfirmed(!confirmed)}
                className={cn(
                  'w-full h-14 rounded-xl font-heading font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 cursor-pointer select-none',
                  confirmed
                    ? 'bg-taken text-white shadow-taken/30'
                    : 'bg-primary hover:bg-primary-dark text-white shadow-primary/25 ring-4 ring-primary/20'
                )}
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>{confirmed ? tCommon('all_good') : tCommon('taken_button')}</span>
              </button>
            </div>

            {/* Mini Footer Notice */}
            <p className="text-[11px] text-center text-muted">
              {tLanding('escalationStep1Desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
