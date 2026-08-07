import type { AssignableReputationUser } from '@yuta/contracts/cloud-admin';
import type {
  FeedbackSentiment,
  FeedbackSource,
  FeedbackStatus,
  FeedbackUrgency,
} from '@yuta/contracts/reputation';

export type ReviewListRecord = {
  id: string;
  source: FeedbackSource;
  authorName: string | null;
  authorAvatarUrl: string | null;
  rating: number | null;
  content: string | null;
  sentiment: FeedbackSentiment | null;
  urgency: FeedbackUrgency | null;
  status: FeedbackStatus;
  assignedToUserId: string | null;
  receivedAt: string;
  incidentId: string | null;
  replyStatus: string | null;
};

export type ReviewDetailRecord = ReviewListRecord & {
  externalUrl: string | null;
  analysis: {
    summary: string;
    topics: string[];
    suggestedAction: string | null;
  } | null;
  latestReply: {
    id: string;
    content: string;
    status: string;
  } | null;
  notes: Array<{
    id: string;
    content: string;
    authorName: string;
    createdAt: string;
  }>;
};

export type ReviewsPageData = {
  state: 'ready' | 'unavailable';
  items: ReviewListRecord[];
  detail: ReviewDetailRecord | null;
  assignableUsers: AssignableReputationUser[];
  query: {
    source: FeedbackSource | null;
    status: FeedbackStatus | null;
    rating: number | null;
    search: string;
    sort:
      | 'newest'
      | 'oldest'
      | 'rating_asc'
      | 'rating_desc'
      | 'urgency_desc'
      | 'unanswered';
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  counters: {
    total: number;
    new: number;
    unanswered: number;
    negative: number;
    withIncident: number;
  };
  permissions: {
    canManageFeedback: boolean;
    canCreateReply: boolean;
    canCreateNote: boolean;
  };
};

export type ReviewsPageMode = 'all' | 'direct';

export type UpdateReviewsQuery = (
  updates: Record<string, string | number | null>,
  options?: { keepSelected?: boolean },
) => void;

export const statusLabels: Record<FeedbackStatus, string> = {
  NEW: 'Nouveau',
  TO_PROCESS: 'À traiter',
  DRAFTED: 'Brouillon',
  REPLIED: 'Répondu',
  FOLLOW_UP: 'À suivre',
  RESOLVED: 'Résolu',
  ARCHIVED: 'Archivé',
  SPAM: 'Indésirable',
};

export const statusTones: Record<
  FeedbackStatus,
  'neutral' | 'brand' | 'warning' | 'success' | 'danger'
> = {
  NEW: 'brand',
  TO_PROCESS: 'brand',
  DRAFTED: 'warning',
  REPLIED: 'success',
  FOLLOW_UP: 'danger',
  RESOLVED: 'success',
  ARCHIVED: 'neutral',
  SPAM: 'neutral',
};

export const sentimentLabels: Record<FeedbackSentiment, string> = {
  POSITIVE: 'Positif',
  NEUTRAL: 'Neutre',
  NEGATIVE: 'Négatif',
};

export const sentimentTones: Record<
  FeedbackSentiment,
  'success' | 'neutral' | 'danger'
> = {
  POSITIVE: 'success',
  NEUTRAL: 'neutral',
  NEGATIVE: 'danger',
};

export const urgencyLabels: Record<FeedbackUrgency, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

export function getInitials(name: string | null): string {
  if (!name) return 'A';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function formatRelativeDate(value: string): string {
  const date = new Date(value);
  const elapsedMinutes = Math.max(
    1,
    Math.round((Date.now() - date.getTime()) / 60_000),
  );
  if (elapsedMinutes < 60) return `Il y a ${elapsedMinutes} min`;
  const hours = Math.round(elapsedMinutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return `Il y a ${Math.round(hours / 24)} j`;
}

export function formatAbsoluteDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function urgencyTone(
  urgency: FeedbackUrgency,
): 'danger' | 'warning' | 'neutral' {
  if (urgency === 'CRITICAL' || urgency === 'HIGH') return 'danger';
  if (urgency === 'MEDIUM') return 'warning';
  return 'neutral';
}
