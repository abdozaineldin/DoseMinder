import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-13 w-full rounded-[16px] border-2 bg-card px-4 py-3 text-base font-body text-ink placeholder:text-muted/60 transition-colors duration-150',
          'border-line hover:border-primary/60 focus:border-primary focus:outline-none focus:ring-0',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-sand/30',
          error && 'border-emergency focus:border-emergency',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
