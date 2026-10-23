'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

export type ConnectionState = 'online' | 'offline' | 'syncing' | 'error';

export interface ConnectionPillProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: ConnectionState;
  pendingCount?: number;
}

export function ConnectionPill({
  state = 'online',
  pendingCount = 0,
  className,
  ...props
}: ConnectionPillProps) {
  const t = useTranslations('common');

  const config = {
    online: {
      icon: Wifi,
      text: t('synced'),
      color: 'bg-taken/10 text-taken border-taken/20',
      dot: 'bg-taken',
    },
    offline: {
      icon: WifiOff,
      text: t('offline_pending', { n: pendingCount }),
      color: 'bg-missed/10 text-missed border-missed/20',
      dot: 'bg-missed',
    },
    syncing: {
      icon: RefreshCw,
      text: t('loading'),
      color: 'bg-saffron/10 text-saffron border-saffron/20',
      dot: 'bg-saffron animate-ping',
    },
    error: {
      icon: AlertTriangle,
      text: t('error'),
      color: 'bg-missed/10 text-missed border-missed/20',
      dot: 'bg-missed',
    },
  }[state];

  const Icon = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors select-none',
        config.color,
        className
      )}
      {...props}
    >
      <span className={cn('w-2 h-2 rounded-full shrink-0', config.dot)} aria-hidden="true" />
      <Icon className={cn('w-3.5 h-3.5 shrink-0', state === 'syncing' && 'animate-spin')} aria-hidden="true" />
      <span className="truncate max-w-[140px] sm:max-w-none">{config.text}</span>
    </div>
  );
}
