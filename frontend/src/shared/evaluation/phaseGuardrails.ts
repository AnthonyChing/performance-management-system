import type { ReviewStatus } from '../../api/manager';
import type { TeamEvaluationSubmissionStatus } from './types';

const MANAGER_EDITABLE_STATUSES = new Set<ReviewStatus>([
  'pending_manager_eval',
  'manager_eval_in_progress',
]);

const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending_self_eval: '等待員工自評',
  self_eval_in_progress: '員工自評進行中',
  pending_manager_eval: '待主管評核',
  manager_eval_in_progress: '主管評核進行中',
  pending_hr_review: '待 HR 覆核',
  completed: '考核已完成',
  terminated: '考核已終止',
};

export function isManagerEvaluationEditable(status: ReviewStatus | undefined): boolean {
  if (!status) return false;
  return MANAGER_EDITABLE_STATUSES.has(status);
}

export function getManagerEvaluationLockReason(status: ReviewStatus | undefined): string | null {
  if (!status) {
    return '尚無本期考核資料，無法進行評核。';
  }
  if (isManagerEvaluationEditable(status)) {
    return null;
  }
  return `目前處於「${REVIEW_STATUS_LABELS[status]}」階段，主管無法編輯評核內容。`;
}

export function getReviewStatusLabel(status: ReviewStatus | undefined): string {
  if (!status) return '未建立';
  return REVIEW_STATUS_LABELS[status];
}

export function deriveSubmissionStatus(
  evaluation: {
    status: ReviewStatus;
    manager_submitted_at?: string | null;
  } | null,
): TeamEvaluationSubmissionStatus {
  if (!evaluation) {
    return 'not_started';
  }

  if (!isManagerEvaluationEditable(evaluation.status)) {
    if (
      evaluation.status === 'pending_hr_review' ||
      evaluation.status === 'completed' ||
      evaluation.manager_submitted_at
    ) {
      return 'submitted';
    }
    return 'locked';
  }

  if (evaluation.status === 'manager_eval_in_progress' || evaluation.manager_submitted_at) {
    return 'in_progress';
  }

  return 'not_started';
}

export function getSubmissionStatusLabel(status: TeamEvaluationSubmissionStatus): string {
  switch (status) {
    case 'not_started':
      return '未開始';
    case 'in_progress':
      return '評核中';
    case 'submitted':
      return '已提交';
    case 'locked':
      return '不可編輯';
    default:
      return status;
  }
}
