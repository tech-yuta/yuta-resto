import 'server-only';

import { feedbackListQuerySchema } from '@yuta/contracts/reputation';
import {
  getBookingAdministration,
  listFeedback,
  listReservations,
} from '@yuta/db-cloud';
import { requireEstablishment } from '@yuta/tenant';
import { redirect } from 'next/navigation';
import { requireBookingPermission } from '../../../server/auth/permissions';
import { requireReputationPermission } from '../../../server/auth/permissions';
import { requireAuthenticatedTenant } from '../../../server/auth/session';
import { cloudDatabase } from '../../../server/cloud-database';
import {
  formatRelativeTime,
  formatTimeRange,
  getLocalDateTimeParts,
  getServiceState,
  isActiveTodayReservation,
  reservationStatusPresentation,
  resolveServicePeriodForToday,
  serviceStateLabel,
  type TodayReservationTone,
  type TodayServiceState,
} from './today-view-model';

export type TodaySection<T> =
  | { state: 'ready'; data: T }
  | { state: 'empty' }
  | { state: 'unavailable'; retryable: boolean };

export type TodayReservationItem = {
  id: string;
  localTime: string;
  guestName: string;
  partySize: number;
  statusLabel: string;
  statusTone: TodayReservationTone;
};

export type TodayServiceItem = {
  id: string;
  name: string;
  timeRange: string;
  capacity: number;
  state: TodayServiceState;
  stateLabel: string;
};

export type TodayReviewItem = {
  id: string;
  source: 'GOOGLE' | 'DIRECT';
  authorName: string;
  rating: number | null;
  excerpt: string;
  receivedLabel: string;
};

export type TodayDashboardData = {
  localDate: string;
  locale: string;
  timezone: string;
  displayName: string;
  bookingEnabled: boolean;
  reputationEnabled: boolean;
  canManageBookingSettings: boolean;
  reservations: TodaySection<{
    count: number;
    confirmedCount: number;
    pendingCount: number;
    items: TodayReservationItem[];
  }>;
  services: TodaySection<{
    count: number;
    items: TodayServiceItem[];
  }>;
  reviews:
    | TodaySection<{ attentionCount: number; items: TodayReviewItem[] }>
    | { state: 'hidden' };
};

export async function loadTodayDashboard(): Promise<TodayDashboardData> {
  const { session, tenant } = await requireAuthenticatedTenant('/aujourdhui');
  if (!tenant.establishmentId) {
    redirect('/resolution-etablissement?returnTo=%2Faujourdhui');
  }
  requireEstablishment(tenant);

  const now = new Date();
  const { localDate, localTime, dayOfWeek } = getLocalDateTimeParts(
    tenant.timezone,
    now,
  );
  const bookingEnabled = tenant.entitlements.has('booking.enabled');
  const reputationEnabled = tenant.entitlements.has('reputation.enabled');
  const canManageBookingSettings =
    tenant.actor.type === 'user' &&
    (tenant.actor.role === 'OWNER' || tenant.actor.role === 'MANAGER');

  if (bookingEnabled) {
    requireBookingPermission(tenant, 'booking.read');
  }
  if (reputationEnabled) {
    requireReputationPermission(tenant, 'reputation.read');
  }

  const [reservations, services, reviews] = await Promise.all([
    bookingEnabled
      ? loadSection('today reservations', async () => {
          const rows = await listReservations(
            cloudDatabase,
            tenant,
            localDate,
            localDate,
          );
          const activeRows = rows.filter((row) =>
            isActiveTodayReservation(row.status),
          );
          if (activeRows.length === 0) return { state: 'empty' as const };
          return {
            state: 'ready' as const,
            data: {
              count: activeRows.length,
              confirmedCount: activeRows.filter(
                (row) => row.status === 'CONFIRMED',
              ).length,
              pendingCount: activeRows.filter((row) => row.status === 'PENDING')
                .length,
              items: activeRows.slice(0, 6).map((row) => {
                const presentation = reservationStatusPresentation(row.status);
                return {
                  id: row.id,
                  localTime: row.localTime.slice(0, 5),
                  guestName: `${row.guestFirstName} ${row.guestLastName}`,
                  partySize: row.partySize,
                  statusLabel: presentation.label,
                  statusTone: presentation.tone,
                };
              }),
            },
          };
        })
      : Promise.resolve({ state: 'empty' as const }),
    bookingEnabled
      ? loadSection('today booking services', async () => {
          const administration = await getBookingAdministration(
            cloudDatabase,
            tenant,
          );
          const todayExceptions = administration.exceptions.filter(
            (exception) => exception.exceptionDate === localDate,
          );
          const periods = administration.periods
            .filter(
              (period) => period.enabled && period.dayOfWeek === dayOfWeek,
            )
            .map((period) =>
              resolveServicePeriodForToday(period, todayExceptions),
            )
            .filter((period) => period !== null);
          if (periods.length === 0) return { state: 'empty' as const };
          return {
            state: 'ready' as const,
            data: {
              count: periods.length,
              items: periods.map((period) => {
                const state = getServiceState(
                  period.startTime,
                  period.endTime,
                  localTime,
                );
                return {
                  id: period.id,
                  name: period.name,
                  timeRange: formatTimeRange(period.startTime, period.endTime),
                  capacity: period.capacity,
                  state,
                  stateLabel: serviceStateLabel(state),
                };
              }),
            },
          };
        })
      : Promise.resolve({ state: 'empty' as const }),
    reputationEnabled
      ? loadSection('today reviews', async () => {
          const result = await listFeedback(
            cloudDatabase,
            tenant,
            feedbackListQuerySchema.parse({
              sort: 'unanswered',
              page: 1,
              pageSize: 6,
            }),
          );
          const items = result.items
            .filter(
              (item) =>
                item.replyStatus !== 'PUBLISHED' &&
                !['RESOLVED', 'ARCHIVED', 'SPAM'].includes(item.status),
            )
            .slice(0, 3)
            .map((item) => ({
              id: item.id,
              source: item.source,
              authorName: item.authorName ?? 'Client anonyme',
              rating: item.rating,
              excerpt: item.content || 'Aucun commentaire.',
              receivedLabel: formatRelativeTime(
                item.receivedAt,
                now,
                tenant.locale,
              ),
            }));
          if (result.counters.unanswered === 0) {
            return { state: 'empty' as const };
          }
          return {
            state: 'ready' as const,
            data: {
              attentionCount: result.counters.unanswered,
              items,
            },
          };
        })
      : Promise.resolve({ state: 'hidden' as const }),
  ]);

  return {
    localDate,
    locale: tenant.locale,
    timezone: tenant.timezone,
    displayName: session.userName,
    bookingEnabled,
    reputationEnabled,
    canManageBookingSettings,
    reservations,
    services,
    reviews,
  };
}

async function loadSection<T>(
  label: string,
  loader: () => Promise<T>,
): Promise<T | { state: 'unavailable'; retryable: true }> {
  try {
    return await loader();
  } catch (error: unknown) {
    console.error(`Unable to load ${label}.`, error);
    return { state: 'unavailable', retryable: true };
  }
}
