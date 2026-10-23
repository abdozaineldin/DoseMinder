import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';
import { getHomeRouteForRole, isValidRole } from '@/lib/auth/role-routes';
import type { UserRole } from '@/db/database.types';

/**
 * Validates Supabase environment variables.
 * - In development: if variables are missing or placeholder, allows rendering (bypass) for UI development.
 * - In production: rejects immediately to prevent unauthorized access.
 */
function validateSupabaseEnv(): { bypassInDev: boolean } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isMissing = !url || !anonKey || url.includes('placeholder.supabase.co') || anonKey === 'placeholder-key';

  if (isMissing) {
    if (process.env.NODE_ENV === 'development') {
      return { bypassInDev: true };
    }
    throw new Error('Database environment variables are missing or invalid in production. Access denied.');
  }

  return { bypassInDev: false };
}

export type SessionInfo = {
  user: { id: string } | null;
  role: UserRole | null;
};

/**
 * Reads user session and verified role.
 * - The role is determined EXCLUSIVELY from `profiles.role`.
 * - `user_metadata.role` is NEVER used or trusted as fallback.
 * - `redirect()` is NEVER called inside this function or inside any try/catch block.
 */
export async function getSessionInfo(): Promise<SessionInfo> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { user: null, role: null };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const rawRole = (profile as { role?: unknown } | null)?.role;
    return { user, role: isValidRole(rawRole) ? rawRole : null };
  } catch {
    // Any failure (network, bad config, expired session) => treat as unauthenticated
    return { user: null, role: null };
  }
}

/**
 * Protects routes requiring a specific role (e.g. /patient/*, /caregiver/*, /doctor/*).
 * If not signed in or role is missing, redirects to /login.
 * If signed in with another role, redirects to that role's home route.
 */
export async function protectRoleRoute(expectedRole: UserRole, locale: string) {
  const { bypassInDev } = validateSupabaseEnv();
  if (bypassInDev) {
    return null;
  }

  const { user, role } = await getSessionInfo();

  // No session, or no readable profile/role in profiles => redirect to login.
  // redirect() must always remain OUTSIDE try/catch because Next.js redirect() throws NEXT_REDIRECT.
  if (!user || !role) {
    redirect({ href: '/login', locale });
    return null; // unreachable (redirect throws), keeps TypeScript happy
  }

  if (role !== expectedRole) {
    redirect({ href: getHomeRouteForRole(role), locale });
    return null;
  }

  return user;
}

/**
 * Protects guest-only routes (e.g. /login, /register).
 * Redirects already-authenticated users to their designated role home page.
 */
export async function protectGuestRoute(locale: string) {
  const { bypassInDev } = validateSupabaseEnv();
  if (bypassInDev) {
    return null;
  }

  const { user, role } = await getSessionInfo();

  // Only bounce signed-in users that have a verified role
  if (user && role) {
    redirect({ href: getHomeRouteForRole(role), locale });
    return user;
  }

  return null;
}
