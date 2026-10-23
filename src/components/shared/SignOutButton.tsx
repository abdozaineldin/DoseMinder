'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Button, type ButtonProps } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function SignOutButton({
  variant = 'outline',
  size = 'default',
  className,
  ...props
}: ButtonProps) {
  const tShells = useTranslations('shells');
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignored
    } finally {
      setLoading(false);
      router.push('/login');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={loading}
      onClick={handleSignOut}
      className={className}
      {...props}
    >
      <LogOut className="w-4 h-4 shrink-0" />
      <span>{tShells('signOut')}</span>
    </Button>
  );
}
