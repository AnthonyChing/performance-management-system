import type { EvaluationQuestion } from '../types';
import type { QuestionnaireDraftResponse } from '../../../../shared/evaluation';

interface QuestionnaireFormProps {
  questions: EvaluationQuestion[];
  draft: Record<string, QuestionnaireDraftResponse>;
  fieldErrors: Record<string, string>;
  disabled: boolean;
  onChange: (questionId: string, patch: Partial<QuestionnaireDraftResponse>) => void;
}

export default function QuestionnaireForm({
  questions,
  draft,
  fieldErrors,
  disabled,
  onChange,
}: QuestionnaireFormProps) {
  return (
    <div className="space-y-5">
      {questions.map((question, index) => {
        const response = draft[question.id];
        const error = fieldErrors[question.id];

        return (
          <div
            key={question.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  問題 {index + 1}
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{question.question_text}</p>
              </div>
              {question.is_required && (
                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                  必填
                </span>
              )}
            </div>

            {question.question_type === 'rating' && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    { length: question.rating_scale_max ?? 5 },
                    (_, ratingIndex) => ratingIndex + 1,
                  ).map((value) => {
                    const selected = response?.rating_value === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(question.id, { rating_value: value })}
                        className={`w-10 h-10 rounded-lg text-sm font-bold border transition-colors ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400">
                  評分量表：1 至 {question.rating_scale_max ?? 5}
                </p>
              </div>
            )}

            {question.question_type === 'text' && (
              <textarea
                disabled={disabled}
                value={response?.text_value ?? ''}
                onChange={(event) => onChange(question.id, { text_value: event.target.value })}
                placeholder="請輸入您的評核說明..."
                className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg p-3 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 h-28 disabled:opacity-60"
              />
            )}

            {question.question_type === 'boolean' && (
              <div className="flex gap-2">
                {[
                  { label: '是', value: true },
                  { label: '否', value: false },
                ].map((option) => {
                  const selected = response?.boolean_value === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange(question.id, { boolean_value: option.value })}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                        selected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}

            {error && <p className="text-[11px] font-semibold text-rose-600">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}
