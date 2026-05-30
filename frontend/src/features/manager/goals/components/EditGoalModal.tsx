import type { FormEvent } from 'react';
import { Settings } from 'lucide-react';
import type { ReviewItem } from '../types';

interface EditGoalModalProps {
  goal: ReviewItem;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (nextGoal: ReviewItem) => void;
}

export default function EditGoalModal({ goal, onClose, onSubmit, onChange }: EditGoalModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            編輯同仁指標
          </h3>
          <p className="text-xs text-slate-400 mt-1">更新指標名稱、權重配置或預期目標。</p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">目標 / KPI 標題</label>
            <input
              type="text"
              required
              value={goal.title}
              onChange={(e) => onChange({ ...goal, title: e.target.value })}
              className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
            />
          </div>

          {goal.type === 'KPI' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">權重分比 (%)</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={goal.weight || 0}
                  onChange={(e) => onChange({ ...goal, weight: Number(e.target.value) })}
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">預期量化目標</label>
                <input
                  type="text"
                  value={goal.target || ''}
                  onChange={(e) => onChange({ ...goal, target: e.target.value })}
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">截止日期</label>
            <input
              type="date"
              value={goal.dueDate}
              onChange={(e) => onChange({ ...goal, dueDate: e.target.value })}
              className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
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
              className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors shadow-sm"
            >
              保存變更
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
