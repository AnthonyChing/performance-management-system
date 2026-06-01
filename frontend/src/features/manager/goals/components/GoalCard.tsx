import { CheckCircle, XCircle, Clock, FileCheck, RefreshCw } from 'lucide-react';
import type { ReviewItem } from '../types';

interface GoalCardProps {
  goal: ReviewItem;
  teamName: string;
  onApprove: (id: string) => void;
  onReject: (goal: ReviewItem) => void;
  onEvaluate: (goal: ReviewItem) => void;
  onReset: (id: string) => void;
}

export default function GoalCard({ goal, teamName, onApprove, onReject, onEvaluate, onReset }: GoalCardProps) {
  const isPending = goal.status === '待審核';
  const isActive = goal.status === '進行中';
  const isRejected = goal.status === '已否決';
  const isEvaluated = goal.status === '已評估';

  return (
    <div
      key={goal.id}
      className={`bg-white rounded-xl border p-6 shadow-sm transition-all hover:border-black flex flex-col justify-between gap-6 ${isPending ? 'border-amber-200 bg-amber-50/10' : isActive ? 'border-gray-400' : 'border-slate-200'}`}
    >
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {isPending && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
              <Clock className="w-3 h-3" /> 待審核
            </span>
          )}
          {isActive && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> 待評分
            </span>
          )}
          {isEvaluated && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 flex items-center gap-1">
              <FileCheck className="w-3 h-3" /> 已評估
            </span>
          )}
          {isRejected && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> 已否決
            </span>
          )}

          <span className="text-xs text-slate-400 font-medium">•</span>
          <span className="text-xs text-slate-500 font-semibold">{goal.dueDate} 截止</span>
        </div>

        <h3 className="text-base font-bold text-slate-800 leading-tight">{goal.title}</h3>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">組員：{goal.memberName}</span>
          <span className="text-slate-300 text-xs">|</span>
          <span className="text-xs text-slate-500 font-medium">所屬：{teamName}</span>
        </div>

        {goal.type === 'KPI' && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1.5 mt-2">
            <div className="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-md">
              <span className="font-bold text-slate-500">KPI 權重</span>
              <span className="font-mono text-sm font-bold text-indigo-600">{goal.weight}%</span>
            </div>
            {goal.target && (
              <div className="bg-white p-2 border border-slate-100 rounded-md">
                <span className="block font-bold text-slate-500 mb-1">目標量化值</span>
                <span className="text-slate-700 font-medium">{goal.target}</span>
              </div>
            )}
          </div>
        )}

        {isEvaluated && (
          <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 text-xs text-slate-700 space-y-1.5 mt-2 shadow-sm">
            <div className="font-bold text-indigo-800 flex items-center justify-between">
              <span>考核評分</span>
              <span className="font-mono text-base">{goal.score} 分</span>
            </div>
            <div className="pt-2 border-t border-indigo-100/50">
              <span className="font-bold text-slate-500 mb-1 block">主管期末評語：</span>
              <p className="text-slate-600 bg-white p-2 rounded border border-indigo-100/60 leading-relaxed italic">「{goal.evaluationComment}」</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        {isPending && (
          <>
            <button
              onClick={() => onReject(goal)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-md shadow-sm transition-colors"
            >
              <XCircle className="w-4 h-4" />
              否決退回
            </button>

            <button
              onClick={() => onApprove(goal.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-sm transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              同意核准
            </button>
          </>
        )}
        {isActive && (
          <button
            onClick={() => onEvaluate(goal)}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-sm transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            進行期末考核評分
          </button>
        )}
        {isRejected && (
          <button
            onClick={() => onReset(goal.id)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            重置為待審核
          </button>
        )}
      </div>
    </div>
  );
}
