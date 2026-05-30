export type {
  Appeal,
  AppealResponse,
} from '../../../api/manager';

/** All possible API appeal statuses */
export type AppealStatus =
  | 'submitted'
  | 'under_review'
  | 'need_more_info'
  | 'approved'
  | 'rejected'
  | 'cancelled';

/** Filter value — includes 'all' for the "show everything" option */
export type DisputeStatusFilter = 'all' | AppealStatus;

/** Chinese display label for each API status */
export const APPEAL_STATUS_LABELS: Record<AppealStatus, string> = {
  submitted: '已提交',
  under_review: '審核中',
  need_more_info: '需補充資料',
  approved: '已核准',
  rejected: '已駁回',
  cancelled: '已取消',
};

/** Whether the appeal is still actionable (manager can respond) */
export function isAppealOpen(status: AppealStatus): boolean {
  return status === 'submitted' || status === 'under_review' || status === 'need_more_info';
}
