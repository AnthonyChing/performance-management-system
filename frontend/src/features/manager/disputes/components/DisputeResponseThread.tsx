import { MessageSquare, ShieldCheck } from 'lucide-react';
import type { AppealResponse } from '../types';

interface DisputeResponseThreadProps {
  responses: AppealResponse[];
}

function formatDateTime(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DisputeResponseThread({ responses }: DisputeResponseThreadProps) {
  if (responses.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          處理紀錄
        </h3>
        <div className="py-8 text-center text-slate-400 text-xs">
          尚未有任何回覆紀錄
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
        <MessageSquare className="w-4 h-4 text-indigo-500" />
        處理紀錄 ({responses.length} 則)
      </h3>

      <div className="mt-4 space-y-3">
        {responses.map((response, index) => (
          <div
            key={response.id}
            className={`relative rounded-lg border p-4 transition-all ${
              response.is_final
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-slate-100 bg-slate-50/50'
            }`}
          >
            {/* Thread connector line */}
            {index < responses.length - 1 && (
              <div className="absolute left-7 top-full w-0.5 h-3 bg-slate-200" />
            )}

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    response.is_final
                      ? 'bg-emerald-200 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-600'
                  }`}
                >
                  {response.responded_by ? response.responded_by.substring(0, 2) : 'M'}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-700">
                    {response.responded_by || '主管'}
                  </span>
                  {response.is_final && (
                    <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded-full">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      最終裁決
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {formatDateTime(response.responded_at)}
              </span>
            </div>

            <p className="mt-2.5 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap pl-9">
              {response.response_text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
