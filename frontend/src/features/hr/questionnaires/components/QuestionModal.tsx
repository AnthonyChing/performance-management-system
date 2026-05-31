import React, { useState } from 'react';
import { X, Info, Loader2, AlertCircle } from 'lucide-react';
import { ApiRequestError } from '../api';

export type QuestionType = 'rating' | 'text' | 'boolean';

export const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'rating', label: 'Rating Scale (評分級距)' },
  { value: 'text', label: 'Text (簡答題)' },
  { value: 'boolean', label: 'Multiple Choice (單選題)' },
];

export interface QuestionModalInitialData {
  question_text: string;
  question_type: QuestionType;
  rating_scale_max?: number | null;
  is_required: boolean;
}

export interface QuestionModalSaveData {
  question_text: string;
  question_type: QuestionType;
  rating_scale_max?: number;
  is_required: boolean;
}

interface QuestionModalProps {
  initial: QuestionModalInitialData | null;
  onSave: (data: QuestionModalSaveData) => void | Promise<void>;
  onClose: () => void;
}

export default function QuestionModal({
  initial,
  onSave,
  onClose,
}: QuestionModalProps) {
  const [text, setText] = useState(initial?.question_text ?? '');
  const [type, setType] = useState<QuestionType>((initial?.question_type as QuestionType) ?? 'rating');
  const [scale, setScale] = useState(initial?.rating_scale_max ?? 5);
  const [required, setRequired] = useState(initial?.is_required ?? true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    if (!text.trim()) { setErr('請輸入問題題目'); return; }
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        question_text: text.trim(),
        question_type: type,
        rating_scale_max: type === 'rating' ? scale : undefined,
        is_required: required,
      });
    } catch (e) {
      setErr(e instanceof ApiRequestError ? e.message : '儲存失敗');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{initial ? '編輯問卷問題' : '建立問卷問題'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {err && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{err}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">問題題目 (QUESTION TITLE)</label>
            <textarea
              rows={4}
              className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm resize-none"
              placeholder="請輸入績效考核問題描述..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">問題類型 (QUESTION TYPE)</label>
              <select
                className="w-full border border-slate-300 rounded-md py-2.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm appearance-none"
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {type === 'rating' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">評分最高分 (MAX SCALE)</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">是否為必填 (IS MANDATORY)</label>
            <div className="flex items-center gap-4">
              <select
                className="w-48 border border-slate-300 rounded-md py-2.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm appearance-none"
                value={required ? 'yes' : 'no'}
                onChange={(e) => setRequired(e.target.value === 'yes')}
              >
                <option value="yes">Yes (是)</option>
                <option value="no">No (否)</option>
              </select>
              <div className="flex items-center text-sm text-slate-500">
                <Info className="w-4 h-4 mr-1.5" />
                此設定會影響問卷的驗證規則
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !text.trim()}
            className="px-5 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? '確定儲存' : '確定新增問題'}
          </button>
        </div>
      </div>
    </div>
  );
}
