import type { AvailableTenant } from './contracts';

export type PostLoginResolution =
  | { type: 'NO_ESTABLISHMENT' }
  | { type: 'AUTO_ACTIVATE'; membership: AvailableTenant }
  | {
      type: 'SELECT_ESTABLISHMENT';
      establishments: AvailableTenant[];
    };

export function resolvePostLoginDestination(
  establishments: AvailableTenant[],
): PostLoginResolution {
  if (establishments.length === 0) return { type: 'NO_ESTABLISHMENT' };
  if (establishments.length === 1) {
    return { type: 'AUTO_ACTIVATE', membership: establishments[0]! };
  }
  return { type: 'SELECT_ESTABLISHMENT', establishments };
}
