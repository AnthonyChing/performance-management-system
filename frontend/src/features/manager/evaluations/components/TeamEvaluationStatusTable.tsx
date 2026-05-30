import { ChevronRight } from 'lucide-react';
import type { TeamMemberEvaluationRow } from '../types';
import EvaluationStatusBadge from './EvaluationStatusBadge';
import { getReviewStatusLabel } from '../../../../shared/evaluation';

interface TeamEvaluationStatusTableProps {
  rows: TeamMemberEvaluationRow[];
  selectedMemberId: string | null;
  onSelect: (memberId: string) => void;
}

export default function TeamEvaluationStatusTable({
  rows,
  selectedMemberId,
  onSelect,
}: TeamEvaluationStatusTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-800">團隊考核狀態</h2>
        <p className="text-xs text-slate-400 mt-1">點選部屬以進入問卷評估與 KPI 評分</p>
      </div>

      <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
        {rows.map((row) => {
          const isSelected = row.member.id === selectedMemberId;
          return (
            <button
              key={row.member.id}
              type="button"
              onClick={() => onSelect(row.member.id)}
              className={`w-full text-left px-5 py-4 transition-colors flex items-center gap-4 ${
                isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'
              }`}
            >
              <img
                src={row.member.avatar}
                alt={row.member.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 truncate">{row.member.name}</span>
                  <EvaluationStatusBadge status={row.submissionStatus} />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {row.teamName} · {row.member.role}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {row.error
                    ? row.error
                    : getReviewStatusLabel(row.evaluation?.status)}
                </p>
              </div>
              <ChevronRight
                className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
