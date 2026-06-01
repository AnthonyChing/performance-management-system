import { Target, Edit3, Trash2, ChevronRight, Gauge, Percent } from 'lucide-react';
import type { KpiCriterion } from '../api';

interface KpiCriterionCardProps {
  kpi: KpiCriterion;
  employeeName: string;
  onEdit: (kpi: KpiCriterion) => void;
  onDelete: (kpiId: string) => void;
}

function operatorLabel(op: string | null): string {
  switch (op) {
    case '>=': return '≥';
    case '<=': return '≤';
    case '>': return '＞';
    case '<': return '＜';
    case '=': return '＝';
    default: return '';
  }
}

export default function KpiCriterionCard({ kpi, employeeName, onEdit, onDelete }: KpiCriterionCardProps) {
  const hasTarget = kpi.targetValue !== null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group">
      {/* Top Section */}
      <div className="p-5 pb-0">
        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
              kpi.kpiType === 'individual'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-violet-100 text-violet-700'
            }`}
          >
            {kpi.kpiType === 'individual' ? '個人 KPI' : '團隊 KPI'}
          </span>
          {kpi.weight > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-0.5">
              <Percent className="w-2.5 h-2.5" />
              權重 {kpi.weight}%
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-slate-800 leading-snug mb-1">{kpi.title}</h4>

        {/* Description */}
        {kpi.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">{kpi.description}</p>
        )}
      </div>

      {/* Target Criteria Panel */}
      {hasTarget && (
        <div className="mx-5 mt-2 mb-0 bg-gradient-to-r from-indigo-50 to-slate-50 rounded-lg p-3 border border-indigo-100/60">
          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Target className="w-3 h-3" />
            衡量準則
          </div>
          <div className="flex items-baseline gap-1.5">
            {kpi.targetValue !== null && (
              <span className="text-slate-800 font-bold text-lg font-mono">{kpi.targetValue}</span>
            )}
            {kpi.unit && (
              <span className="text-slate-500 text-xs font-medium">{kpi.unit}</span>
            )}
          </div>
          {/* Current progress */}
          {kpi.currentValue !== null && (
            <div className="mt-2 pt-2 border-t border-indigo-100/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">目前數值</span>
                <span className="font-bold font-mono text-slate-700">
                  {kpi.currentValue}
                  {kpi.unit && (
                    <span className="text-slate-400 font-normal ml-0.5">{kpi.unit}</span>
                  )}
                </span>
              </div>
              {kpi.targetValue !== null && kpi.targetValue > 0 && (
                <div className="mt-1.5">
                  <div className="w-full bg-indigo-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${Math.min(100, (kpi.currentValue / kpi.targetValue) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-4 pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium">
          指派給 <span className="text-slate-600 font-semibold">{employeeName}</span>
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(kpi)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="編輯"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(kpi.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="刪除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
