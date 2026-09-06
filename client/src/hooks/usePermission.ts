import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';


export function usePermission(
  permission: string | string[],
  options?: { mode?: 'any' | 'all' }
): boolean {
  const permissions = useSelector((state: RootState) => state.auth.authz.permissions);

  if (!permissions || permissions.length === 0) return false;

  const required = Array.isArray(permission) ? permission : [permission];
  const mode = options?.mode ?? 'any';

  if (mode === 'all') {
    return required.every((p) => permissions.includes(p));
  }
  return required.some((p) => permissions.includes(p));
}
