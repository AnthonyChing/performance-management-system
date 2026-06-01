import { useState } from 'react';
import { Target, Edit3, Trash2, ChevronRight, Gauge, Percent, X, Check } from 'lucide-react';
import type { KpiCriterion } from '../api';

interface KpiCriterionCardProps {
  kpi: KpiCriterion;
  employeeName: string;
  onEdit: (kpi: KpiCriterion) => void;
  onDelete: (kpiId: string) => void;
  isEvaluationOpen?: boolean;
  onUpdateCurrentValue?: (kpiId: string, newValue: number) => void;
}

export default function KpiCriterionCard({ kpi, employeeName, onEdit, onDelete, isEvaluationOpen = false, onUpdateCurrentValue }: KpiCriterionCardProps) {
  const hasTarget = kpi.targetValue !== null;
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateValue, setUpdateValue] = useState(kpi.currentValue?.toString() || '');

  const handleUpdate = () => {
    const val = parseFloat(updateValue);
    if (!isNaN(val) && onUpdateCurrentValue) {
      onUpdateCurrentValue(kpi.id, val);
      setShowUpdateModal(false);
    }
  };

  return (
    <>
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

      {/* Current Value Display & Update Button */}
      <div className="mx-5 mt-3 mb-2 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 block mb-0.5">目前數值</span>
          <span className="font-bold font-mono text-slate-700 text-sm">
            {kpi.currentValue !== null ? kpi.currentValue : '-'}
            {kpi.unit && (
              <span className="text-slate-400 font-normal ml-0.5 text-xs">{kpi.unit}</span>
            )}
          </span>
        </div>
        
        <button
          onClick={() => isEvaluationOpen && setShowUpdateModal(true)}
          disabled={!isEvaluationOpen}
          title={!isEvaluationOpen ? "現在還未開放主管評核" : "更新目前數值"}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            isEvaluationOpen 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
          }`}
        >
          設定數值
        </button>
      </div>

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
    
      {/* Update Value Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">更新目前數值</h3>
              <button 
                onClick={() => setShowUpdateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                目前數值 {kpi.unit && `(${kpi.unit})`}
              </label>
              <input
                type="number"
                value={updateValue}
                onChange={(e) => setUpdateValue(e.target.value)}
                placeholder="請輸入數值..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                autoFocus
              />
            </div>
            
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdate}
                disabled={updateValue.trim() === ''}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
