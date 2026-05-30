import type { FormEvent } from 'react';
import { CheckCircle, FileCheck } from 'lucide-react';
import type { ReviewItem } from '../types';

interface EvaluateGoalModalProps {
  goal: ReviewItem;
  evaluationScore: number;
  evaluationComment: string;
  onScoreChange: (value: number) => void;
  onCommentChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function EvaluateGoalModal({
  goal,
  evaluationScore,
  evaluationComment,
  onScoreChange,
  onCommentChange,
  onClose,
  onSubmit,
}: EvaluateGoalModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-indigo-100 bg-indigo-50">
          <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            期末績效評估 (問卷與評分)
          </h3>
          <p className="text-xs text-indigo-700 mt-1">針對同仁 <b>{goal.memberName}</b> 的 【{goal.title}】 進行評分與評語撰寫。</p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">評核分數 (0-100)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={evaluationScore}
                onChange={(e) => onScoreChange(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="font-mono text-lg font-bold text-indigo-600 w-12 text-right">{evaluationScore}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">主管評估問卷 / 總結評語</label>
            <textarea
              required
              placeholder="請填寫同仁在此指標/項目中的具體表現，以及後續建議..."
              value={evaluationComment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg p-3 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 h-32 shadow-inner"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              提交考核結果
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
