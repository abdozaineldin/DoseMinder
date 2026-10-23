'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type DoseRingStatus = 'taken' | 'due' | 'upcoming' | 'missed';

export interface DoseSegment {
  status: DoseRingStatus;
}

export interface DoseRingProps extends React.HTMLAttributes<HTMLDivElement> {
  segments?: DoseSegment[];
  size?: number;
  strokeWidth?: number;
  centerText?: string;
  subText?: string;
}

export function DoseRing({
  segments = [{ status: 'taken' }, { status: 'due' }, { status: 'upcoming' }],
  size = 140,
  strokeWidth = 12,
  centerText,
  subText,
  className,
  ...props
}: DoseRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.length;

  const takenCount = segments.filter((s) => s.status === 'taken').length;
  const defaultCenter = `${takenCount}/${total}`;

  const colors = {
    taken: 'var(--taken)',
    due: 'var(--saffron)',
    upcoming: 'var(--line)',
    missed: 'var(--missed)',
  };

  // Arc length and gap length calculation
  // Round caps extend strokeWidth/2 at each end, so the gap must exceed strokeWidth to stay visible
  const gapLength = total > 1 ? strokeWidth + 8 : 0;
  const availableLength = circumference - gapLength * total;
  const arcLength = Math.max(1, availableLength / Math.max(total, 1));

  return (
    <div
      className={cn('relative inline-flex items-center justify-center select-none', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={takenCount}
      aria-valuemin={0}
      aria-valuemax={total}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] transform"
      >
        {segments.map((seg, i) => {
          const strokeDashoffset = -(i * (arcLength + gapLength));
          const isDue = seg.status === 'due';

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colors[seg.status]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference - arcLength}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={cn(
                'transition-all duration-500 ease-out',
                isDue && 'animate-pulse'
              )}
            />
          );
        })}
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        <span
          dir="ltr"
          style={{ unicodeBidi: 'isolate' }}
          className="font-heading font-bold text-ink text-xl sm:text-2xl tracking-tight leading-none"
        >
          {centerText || defaultCenter}
        </span>
        {subText && (
          <span className="text-[11px] text-muted font-medium mt-1 leading-tight line-clamp-1">
            {subText}
          </span>
        )}
      </div>
    </div>
  );
}
