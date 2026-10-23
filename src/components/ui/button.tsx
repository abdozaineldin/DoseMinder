import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 select-none whitespace-nowrap rounded-[16px] font-heading font-semibold transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white hover:bg-primary-dark shadow-[var(--shadow-warm-sm)] active:bg-primary-dark',
        primary:
          'bg-primary text-white hover:bg-primary-dark shadow-[var(--shadow-warm-sm)] active:bg-primary-dark',
        secondary:
          'bg-sand text-ink hover:bg-line/70 border border-line/60',
        outline:
          'border-2 border-line bg-card text-ink hover:border-primary hover:text-primary hover:bg-primary-tint/30',
        destructive:
          'bg-emergency text-white hover:bg-emergency/90 shadow-[var(--shadow-warm-sm)]',
        ghost:
          'hover:bg-sand/60 text-ink',
        saffron:
          'bg-saffron text-ink hover:bg-saffron/90 shadow-[var(--shadow-warm-sm)] font-bold',
        taken:
          'bg-taken text-white hover:bg-taken/90 shadow-[var(--shadow-warm-sm)] font-bold',
      },
      size: {
        default: 'h-12 px-6 text-base min-h-[48px]',
        sm: 'h-10 px-4 text-sm min-h-[40px]',
        lg: 'h-14 px-8 text-lg min-h-[56px] rounded-[20px]',
        xl: 'h-16 px-8 text-xl min-h-[56px] rounded-[22px]',
        icon: 'h-12 w-12 min-h-[48px] min-w-[48px] p-0 rounded-full',
        'big-taken':
          'h-16 w-full max-w-[420px] px-8 text-xl tracking-wide rounded-[24px] shadow-lg active:scale-[0.97] min-h-[64px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
