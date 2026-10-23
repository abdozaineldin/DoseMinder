'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Check, Clock, AlertCircle, Circle } from 'lucide-react';

export type StatusChipType = 'taken' | 'due_now' | 'upcoming' | 'missed' | 'late';

export interface StatusChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusChipType;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusChip({ status, size = 'md', className, ...props }: StatusChipProps) {
  const t = useTranslations('common');

  const configs = {
    taken: {
      label: t('status_taken'),
      icon: Check,
      classes: 'bg-taken/15 text-taken border-taken/30',
      pulse: false,
    },
    due_now: {
      label: t('due_now'),
      icon: Clock,
      classes: 'bg-saffron text-ink border-saffron font-semibold shadow-xs',
      pulse: true,
    },
    upcoming: {
      label: t('upcoming'),
      icon: Circle,
      classes: 'bg-sand/80 text-muted border-line',
      pulse: false,
    },
    missed: {
      label: t('missed'),
      icon: AlertCircle,
      classes: 'bg-missed/15 text-missed border-missed/30 font-medium',
      pulse: false,
    },
    late: {
      label: t('late'),
      icon: Check,
      classes: 'bg-saffron/15 text-ink border-saffron/40 font-medium',
      pulse: false,
    },
  }[status];

  const Icon = configs.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border select-none transition-all',
        sizeClasses,
        configs.classes,
        className
      )}
      {...props}
    >
      <Icon
        className={cn(
          size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5',
          configs.pulse && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      <span>{configs.label}</span>
    </span>
  );
}
