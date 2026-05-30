import type { FormEvent } from 'react';
import type { TeamMember } from '../../../../shared/api/mockData';

interface AddGoalModalProps {
  members: TeamMember[];
  newTitle: string;
  newType: '目標' | 'KPI';
  newMember: string;
  newWeight: number;
  newTarget: string;
  newDueDate: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTypeChange: (value: '目標' | 'KPI') => void;
  onMemberChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onWeightChange: (value: number) => void;
  onTargetChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
}

export default function AddGoalModal({
  members,
  newTitle,
  newType,
  newMember,
  newWeight,
  newTarget,
  newDueDate,
  onClose,
  onSubmit,
  onTypeChange,
  onMemberChange,
  onTitleChange,
  onWeightChange,
  onTargetChange,
  onDueDateChange,
}: AddGoalModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">指派／制訂同仁目標 & KPI</h3>
          <p className="text-xs text-slate-400 mt-1">您可以直接以此主管身份在團隊中加入一項指定或待審核的發展指標</p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">指派給同仁</label>
            <select
              value={newMember}
              onChange={(e) => onMemberChange(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">指標型態</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onTypeChange('KPI')}
                className={`py-2 text-xs font-bold rounded-lg border text-center transition-colors ${newType === 'KPI' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-250 hover:bg-slate-50 text-slate-600'}`}
              >
                KPI 績效指標
              </button>
              <button
                type="button"
                onClick={() => onTypeChange('目標')}
                className={`py-2 text-xs font-bold rounded-lg border text-center transition-colors ${newType === '目標' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-250 hover:bg-slate-50 text-slate-600'}`}
              >
                OKRs 發展目標
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">目標 / KPI 標題</label>
            <input
              type="text"
              required
              placeholder="例如: 研究引進 GraphQL 提升行動網頁載入品質"
              value={newTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
            />
          </div>

          {newType === 'KPI' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">權重分比 (%)</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={newWeight}
                  onChange={(e) => onWeightChange(Number(e.target.value))}
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">預期量化目標</label>
                <input
                  type="text"
                  placeholder="如: FCP < 1.5s"
                  value={newTarget}
                  onChange={(e) => onTargetChange(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">截止日期</label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => onDueDateChange(e.target.value)}
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
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              確認建立
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
