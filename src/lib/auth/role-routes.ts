import type { UserRole } from '@/db/database.types';

export function getHomeRouteForRole(role?: UserRole | string | null): string {
  switch (role) {
    case 'caregiver':
      return '/caregiver/family';
    case 'doctor':
      return '/doctor/patients';
    case 'patient':
    default:
      return '/patient/today';
  }
}

export function isValidRole(role: unknown): role is UserRole {
  return role === 'patient' || role === 'caregiver' || role === 'doctor';
}
