import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export function Logo({ size = 'md', showPulse = true, className, ...props }: LogoProps) {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-sm min-[360px]:text-xl sm:text-2xl',
    lg: 'text-3xl',
  };

  const capsuleSizes = {
    sm: 'w-2 h-3.5 border-[1.5px]',
    md: 'w-2.5 h-[18px] border-2',
    lg: 'w-3 h-[22px] border-[2.5px]',
  };

  return (
    <bdi
      dir="ltr"
      style={{ unicodeBidi: 'isolate' }}
      className={cn('inline-flex items-center gap-2 select-none', className)}
      {...props}
    >
      <span
        className={cn(
          'inline-flex items-center font-heading font-bold tracking-tight text-primary',
          textSizes[size]
        )}
      >
        <span>D</span>
        {/* Capsule 'o' */}
        <span
          className={cn(
            'inline-flex flex-col items-center justify-center mx-[3px] rounded-full border-primary bg-primary-tint/50 rotate-[40deg] transform shrink-0 overflow-hidden',
            capsuleSizes[size]
          )}
          aria-hidden="true"
        >
          <span className="w-full h-1/2 bg-primary" />
          <span className="w-full h-1/2 bg-transparent" />
        </span>
        <span>seMinder</span>
      </span>

      {showPulse && (
        <svg
          className="w-10 h-5 text-primary shrink-0 hidden sm:block"
          viewBox="0 0 40 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M 0 10 L 10 10 L 14 3 L 20 17 L 24 10 L 40 10" />
        </svg>
      )}
    </bdi>
  );
}
