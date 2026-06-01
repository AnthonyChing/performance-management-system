import type { FormEvent } from 'react';
import { X, Target, Gauge, FileText, Percent, Tag } from 'lucide-react';
import type { Subordinate } from '../api';

interface CreateKpiModalProps {
  subordinates: Subordinate[];
  selectedSubordinateId: string;
  onSubordinateChange: (id: string) => void;
  title: string;
  description: string;
  kpiType: 'individual' | 'team';
  unit: string;
  targetOperator: string;
  targetValue: string;
  targetUnit: string;
  targetDisplayText: string;
  weight: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onKpiTypeChange: (v: 'individual' | 'team') => void;
  onUnitChange: (v: string) => void;
  onTargetOperatorChange: (v: string) => void;
  onTargetValueChange: (v: string) => void;
  onTargetUnitChange: (v: string) => void;
  onTargetDisplayTextChange: (v: string) => void;
  onWeightChange: (v: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  isEditing?: boolean;
}

export default function CreateKpiModal({
  subordinates,
  selectedSubordinateId,
  onSubordinateChange,
  title,
  description,
  kpiType,
  unit,
  targetOperator,
  targetValue,
  targetUnit,
  targetDisplayText,
  weight,
  onTitleChange,
  onDescriptionChange,
  onKpiTypeChange,
  onUnitChange,
  onTargetOperatorChange,
  onTargetValueChange,
  onTargetUnitChange,
  onTargetDisplayTextChange,
  onWeightChange,
  onSubmit,
  onClose,
  isEditing = false,
}: CreateKpiModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              {isEditing ? '編輯 KPI 準則' : '建立 KPI 準則'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isEditing
                ? '修改此 KPI 指標的衡量標準與權重配置'
                : '為員工設定新的 KPI 考核指標、衡量標準與權重'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/70 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Employee Selector */}
          {!isEditing && (
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                指派給員工
              </label>
              <select
                value={selectedSubordinateId}
                onChange={(e) => onSubordinateChange(e.target.value)}
                className="w-full bg-slate-50 text-sm text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              >
                <option value="">請選擇員工...</option>
                {subordinates.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.jobTitle}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* KPI Type */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              KPI 類型
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onKpiTypeChange('individual')}
                className={`py-2.5 text-xs font-bold rounded-lg border text-center transition-all ${
                  kpiType === 'individual'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                個人績效指標
              </button>
              <button
                type="button"
                onClick={() => onKpiTypeChange('team')}
                className={`py-2.5 text-xs font-bold rounded-lg border text-center transition-all ${
                  kpiType === 'team'
                    ? 'bg-violet-50 border-violet-500 text-violet-700 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                團隊績效指標
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              KPI 名稱
            </label>
            <input
              type="text"
              required
              placeholder="例如：客戶滿意度評分"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full bg-slate-50 text-sm text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">說明描述</label>
            <textarea
              placeholder="簡要說明此 KPI 的衡量內容與目的..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 text-sm text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all resize-none"
            />
          </div>

          {/* Target Criteria Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              衡量目標準則
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Target Operator */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">衡量運算子</label>
                <select
                  value={targetOperator}
                  onChange={(e) => onTargetOperatorChange(e.target.value)}
                  className="w-full bg-white text-xs text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                >
                  <option value="">選擇...</option>
                  <option value=">=">≥ 大於或等於</option>
                  <option value="<=">≤ 小於或等於</option>
                  <option value=">">＞ 大於</option>
                  <option value="<">＜ 小於</option>
                  <option value="=">＝ 等於</option>
                </select>
              </div>

              {/* Target Value */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">目標數值</label>
                <input
                  type="number"
                  required
                  step="any"
                  placeholder="如: 95"
                  value={targetValue}
                  onChange={(e) => onTargetValueChange(e.target.value)}
                  className="w-full bg-white text-xs text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Unit */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">衡量單位</label>
                <input
                  type="text"
                  placeholder="如: 分鐘, 件, %"
                  value={unit}
                  onChange={(e) => onUnitChange(e.target.value)}
                  className="w-full bg-white text-xs text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>

              {/* Target Unit */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">目標單位</label>
                <input
                  type="text"
                  placeholder="如: %、次、筆"
                  value={targetUnit}
                  onChange={(e) => onTargetUnitChange(e.target.value)}
                  className="w-full bg-white text-xs text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                />
              </div>
            </div>

            {/* Target Display Text */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">目標顯示文字</label>
              <input
                type="text"
                placeholder="如：「客戶滿意度 ≥ 95%」"
                value={targetDisplayText}
                onChange={(e) => onTargetDisplayTextChange(e.target.value)}
                className="w-full bg-white text-xs text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
              />
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              權重配比 (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              required
              placeholder="如: 30"
              value={weight}
              onChange={(e) => onWeightChange(e.target.value)}
              className="w-full bg-slate-50 text-sm text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1">所有 KPI 的權重總和建議為 100%</p>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow"
            >
              {isEditing ? '儲存變更' : '確認建立'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
