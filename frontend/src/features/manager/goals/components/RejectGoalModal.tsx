import type { FormEvent } from 'react';
import { XCircle } from 'lucide-react';
import type { ReviewItem } from '../types';

interface RejectGoalModalProps {
  goal: ReviewItem;
  rejectReason: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function RejectGoalModal({
  goal,
  rejectReason,
  onReasonChange,
  onClose,
  onSubmit,
}: RejectGoalModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-rose-100 bg-rose-50">
          <h3 className="text-lg font-bold text-rose-900 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            退回與否決
          </h3>
          <p className="text-xs text-rose-700 mt-1">針對 <b>{goal.memberName}</b> 提出的【{goal.title}】說明否決理由及修改建議。</p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              否決原因 <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              placeholder="例如：此目標範疇過大，需切分至下個季度..."
              value={rejectReason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg p-3 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-rose-100 h-24 shadow-inner"
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
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              確認退回
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
