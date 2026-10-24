import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { Link } from '@/i18n/routing';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-[24px] bg-sand/30 border border-line/60',
        className
      )}
    >
      {/* Calm SVG Illustration of a pill capsule with gentle pulse */}
      <div className="w-24 h-24 mb-6 rounded-full bg-primary-tint/40 flex items-center justify-center text-primary">
        <svg
          className="w-14 h-14"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Gentle Pill Capsule */}
          <rect
            x="14"
            y="22"
            width="36"
            height="20"
            rx="10"
            transform="rotate(-25 32 32)"
            className="stroke-primary fill-card"
          />
          <path
            d="M 23 41 L 41 23"
            className="stroke-primary/70"
            strokeDasharray="2 2"
          />
          {/* Subtle heartbeat pulse line */}
          <path
            d="M 6 32 L 18 32 L 22 24 L 26 40 L 30 32 L 58 32"
            className="stroke-primary/40"
            strokeWidth="2"
          />
        </svg>
      </div>

      <h3 className="font-heading font-bold text-2xl text-ink mb-2 max-w-md">
        {title}
      </h3>
      <p className="font-body text-base text-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        actionHref ? (
          <Link href={actionHref}>
            <Button
              variant="primary"
              size="lg"
              className="min-w-[200px]"
            >
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button
            onClick={onAction}
            variant="primary"
            size="lg"
            className="min-w-[200px]"
          >
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}
