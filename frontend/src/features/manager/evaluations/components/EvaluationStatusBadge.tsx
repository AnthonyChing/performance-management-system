import type { TeamEvaluationSubmissionStatus } from '../types';
import { getSubmissionStatusLabel } from '../../../../shared/evaluation';

interface EvaluationStatusBadgeProps {
  status: TeamEvaluationSubmissionStatus;
}

const STATUS_STYLES: Record<TeamEvaluationSubmissionStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600 border-slate-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  submitted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  locked: 'bg-rose-50 text-rose-600 border-rose-100',
};

export default function EvaluationStatusBadge({ status }: EvaluationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[status]}`}
    >
      {getSubmissionStatusLabel(status)}
    </span>
  );
}
