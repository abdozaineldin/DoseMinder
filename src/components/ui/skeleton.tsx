import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[16px] bg-sand/80 dark:bg-sand/40',
        className
      )}
      {...props}
    />
  );
}
