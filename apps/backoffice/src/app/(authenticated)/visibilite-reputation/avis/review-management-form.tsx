'use client';

import type { AssignableReputationUser } from '@yuta/contracts/cloud-admin';
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yuta/ui';
import { useActionState } from 'react';
import { updateFeedbackAction } from './actions';
import {
  initialReputationActionState,
  ReviewActionMessage,
  ReviewMutationSubmit,
} from './review-action-feedback';
import {
  statusLabels,
  type ReviewDetailRecord,
  type ReviewsPageData,
} from './reviews-model';

export function ReviewManagementForm({
  review,
  assignableUsers,
  canManageFeedback,
}: {
  review: ReviewDetailRecord;
  assignableUsers: AssignableReputationUser[];
  canManageFeedback: ReviewsPageData['permissions']['canManageFeedback'];
}) {
  const [state, action] = useActionState(
    updateFeedbackAction,
    initialReputationActionState,
  );

  return (
    <form
      action={action}
      className="grid gap-3 border-t border-border-default p-4 sm:grid-cols-2"
    >
      <input type="hidden" name="feedbackId" value={review.id} />
      <div className="grid gap-2">
        <Label htmlFor={`feedback-status-${review.id}`}>Statut</Label>
        <Select
          name="status"
          defaultValue={review.status}
          disabled={!canManageFeedback}
        >
          <SelectTrigger id={`feedback-status-${review.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`feedback-assignee-${review.id}`}>Responsable</Label>
        <Select
          name="assignedToUserId"
          defaultValue={review.assignedToUserId ?? 'UNASSIGNED'}
          disabled={!canManageFeedback}
        >
          <SelectTrigger id={`feedback-assignee-${review.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UNASSIGNED">Non attribué</SelectItem>
            {assignableUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <ReviewActionMessage state={state} />
        <ReviewMutationSubmit
          label="Enregistrer le traitement"
          disabled={!canManageFeedback}
        />
      </div>
    </form>
  );
}
