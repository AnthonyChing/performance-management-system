import { Save, Send } from 'lucide-react';
import type { KpiEvaluationDraft, RatingScale, SubordinateKpi } from '../types';
import { RATING_SCALE_OPTIONS } from '../../../../shared/evaluation';

interface KpiScoringFormProps {
  kpis: SubordinateKpi[];
  kpiDrafts: KpiEvaluationDraft[];
  finalRating: RatingScale | '';
  managerComment: string;
  disabled: boolean;
  onKpiChange: (kpiId: string, patch: Partial<KpiEvaluationDraft>) => void;
  onFinalRatingChange: (value: RatingScale) => void;
  onManagerCommentChange: (value: string) => void;
  onSaveDraft: () => void;
  onSubmitFinal: () => void;
  isSaving: boolean;
}

export default function KpiScoringForm({
  kpis,
  kpiDrafts,
  finalRating,
  managerComment,
  disabled,
  onKpiChange,
  onFinalRatingChange,
  onManagerCommentChange,
  onSaveDraft,
  onSubmitFinal,
  isSaving,
}: KpiScoringFormProps) {
  const draftsByKpiId = new Map(kpiDrafts.map((draft) => [draft.kpi_id, draft]));

  return (
    <div className="space-y-5">
      {kpis.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-xs text-slate-400">
          此部屬尚無 KPI 資料，可直接填寫綜合評等與總評。
        </div>
      ) : (
        kpis.map((kpi) => {
          const draft = draftsByKpiId.get(kpi.id) ?? {
            kpi_id: kpi.id,
            current_value: kpi.assignment.current_value ?? '',
            manager_feedback: '',
          };
          const targetValue = kpi.assignment.target_value;
          const currentValue = draft.current_value;
          const sliderMax = Math.max(
            100,
            targetValue ?? 0,
            currentValue === '' ? 0 : currentValue,
          );

          return (
            <div
              key={kpi.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
            >
              <div>
                <p className="text-sm font-bold text-slate-800">{kpi.title}</p>
                {kpi.description && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{kpi.description}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-500">
                  <span>
                    目標：{kpi.assignment.target_value}
                    {kpi.unit ? ` ${kpi.unit}` : ''}
                  </span>
                  {currentValue !== '' && (
                    <span>
                      目前：{currentValue}
                      {kpi.unit ? ` ${kpi.unit}` : ''}
                    </span>
                  )}
                  <span>權重：{kpi.assignment.weight}%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  目前數值{kpi.unit ? ` (${kpi.unit})` : ''}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={sliderMax}
                    step="any"
                    disabled={disabled}
                    value={currentValue === '' ? 0 : currentValue}
                    onChange={(event) =>
                      onKpiChange(kpi.id, { current_value: Number(event.target.value) })
                    }
                    className="w-full accent-indigo-600 disabled:opacity-50"
                  />
                  <input
                    type="number"
                    min={0}
                    step="any"
                    disabled={disabled}
                    value={currentValue}
                    onChange={(event) => {
                      const next = event.target.value;
                      onKpiChange(kpi.id, {
                        current_value: next === '' ? '' : Number(next),
                      });
                    }}
                    className="w-16 bg-slate-50 text-xs text-slate-700 rounded-lg px-2 py-2 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">KPI 評語</label>
                <textarea
                  disabled={disabled}
                  value={draft.manager_feedback}
                  onChange={(event) =>
                    onKpiChange(kpi.id, { manager_feedback: event.target.value })
                  }
                  placeholder="請說明此 KPI 的達成狀況與具體事例..."
                  className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg p-3 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 h-24 disabled:opacity-60"
                />
              </div>
            </div>
          );
        })
      )}

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">綜合評等</label>
          <select
            disabled={disabled}
            value={finalRating}
            onChange={(event) => onFinalRatingChange(event.target.value as RatingScale)}
            className="w-full bg-white text-xs text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
          >
            <option value="">請選擇評等</option>
            {RATING_SCALE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">主管總評</label>
          <textarea
            disabled={disabled}
            value={managerComment}
            onChange={(event) => onManagerCommentChange(event.target.value)}
            placeholder="請撰寫本期整體績效總結..."
            className="w-full bg-white text-xs text-slate-700 rounded-lg p-3 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-100 h-28 disabled:opacity-60"
          />
        </div>
      </div>

      {!disabled && (
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveDraft}
            className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            暫存 KPI 數值
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onSubmitFinal}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            提交最終評核
          </button>
        </div>
      )}
    </div>
  );
}
