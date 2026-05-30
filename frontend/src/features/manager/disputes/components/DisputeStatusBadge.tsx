import {
  Clock,
  Search as SearchIcon,
  CheckCircle2,
  XSquare,
  AlertCircle,
  Ban,
  FileQuestion,
} from 'lucide-react';
import type { AppealStatus } from '../types';
import { APPEAL_STATUS_LABELS } from '../types';

const STATUS_CONFIG: Record<
  AppealStatus,
  { bg: string; text: string; icon: typeof Clock }
> = {
  submitted: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  under_review: { bg: 'bg-blue-100', text: 'text-blue-700', icon: SearchIcon },
  need_more_info: { bg: 'bg-orange-100', text: 'text-orange-700', icon: FileQuestion },
  approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
  rejected: { bg: 'bg-slate-200', text: 'text-slate-600', icon: XSquare },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', icon: Ban },
};

interface DisputeStatusBadgeProps {
  status: AppealStatus;
  size?: 'sm' | 'md';
}

export default function DisputeStatusBadge({ status, size = 'sm' }: DisputeStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.submitted;
  const Icon = config.icon;
  const label = APPEAL_STATUS_LABELS[status] ?? status;

  const sizeClasses =
    size === 'md'
      ? 'px-2.5 py-1 text-xs'
      : 'px-2 py-0.5 text-[9px]';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full whitespace-nowrap ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <Icon className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      {label}
    </span>
  );
}
