import React from 'react';
import { Loader2 } from 'lucide-react';

interface TemplateMetaFormProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  jobCategory: string;
  setJobCategory: (val: string) => void;
  onSaveMeta?: () => void | Promise<void>;
  saving?: boolean;
}

export default function TemplateMetaForm({
  name,
  setName,
  description,
  setDescription,
  jobCategory,
  setJobCategory,
  onSaveMeta,
  saving = false,
}: TemplateMetaFormProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="p-8 space-y-6">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">
            問卷名稱 (QUESTIONNAIRE NAME) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm"
            placeholder="請輸入問卷名稱，例如：2024 年第一季員工滿意度調查"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">問卷說明 (DESCRIPTION)</label>
          <textarea
            rows={4}
            className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm resize-none"
            placeholder="請輸入問卷詳細說明..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">職類 (JOB CATEGORY)</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm"
            placeholder="例如：engineering、hr、sales（可留空）"
            value={jobCategory}
            onChange={(e) => setJobCategory(e.target.value)}
          />
        </div>

        {onSaveMeta && (
          <div className="flex justify-end">
            <button
              onClick={() => void onSaveMeta()}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-slate-700 text-white rounded font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              儲存基本資料
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
