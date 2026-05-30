import { Calendar } from 'lucide-react';
import type { Appeal } from '../types';
import DisputeStatusBadge from './DisputeStatusBadge';

interface DisputeDetailHeaderProps {
  appeal: Appeal;
}

function formatDateTime(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DisputeDetailHeader({ appeal }: DisputeDetailHeaderProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-slate-200 flex items-center justify-center text-xl font-bold text-indigo-700 shrink-0">
          {appeal.filed_by ? appeal.filed_by.substring(0, 2) : '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-800">
              {appeal.case_no || `#${appeal.id.substring(0, 8)}`}
            </h2>
            <DisputeStatusBadge status={appeal.status} size="md" />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            申覆人：{appeal.filed_by} ·
            指派給：{appeal.assigned_to} ({appeal.assigned_to_type})
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              提出日期：{formatDateTime(appeal.filed_at)}
            </span>
            {appeal.resolved_at && (
              <span>· 結案日期：{formatDateTime(appeal.resolved_at)}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Review ID: {appeal.review_id}
          </p>
        </div>
      </div>
    </div>
  );
}
