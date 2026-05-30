import { useState } from 'react';
import { Send, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface DisputeResponseFormProps {
  /** Whether the appeal is still open and can receive responses */
  isOpen: boolean;
  /** Current locked status label to show when closed */
  statusLabel: string;
  /** Whether submission is in progress */
  isSubmitting: boolean;
  onSubmit: (responseText: string, isFinal: boolean) => void;
}

export default function DisputeResponseForm({
  isOpen,
  statusLabel,
  isSubmitting,
  onSubmit,
}: DisputeResponseFormProps) {
  const [responseText, setResponseText] = useState('');
  const [isFinal, setIsFinal] = useState(false);

  const handleSubmitResponse = () => {
    if (!responseText.trim()) return;
    onSubmit(responseText, false);
    setResponseText('');
  };

  const handleApprove = () => {
    if (!responseText.trim()) return;
    onSubmit(responseText, true);
    setResponseText('');
    setIsFinal(false);
  };

  const handleReject = () => {
    if (!responseText.trim()) return;
    onSubmit(responseText, true);
    setResponseText('');
    setIsFinal(false);
  };

  if (!isOpen) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="text-xs font-bold flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-500 rounded-lg justify-center">
          <CheckCircle2 className="w-4 h-4" />
          此案件已結案：{statusLabel}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-indigo-50 rounded-xl p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2">
        <Send className="w-4 h-4 text-indigo-500" />
        回覆與裁決
      </h3>

      <div>
        <label className="block text-[10px] font-bold text-slate-600 mb-2 font-mono uppercase">
          處理意見 <span className="text-rose-500">*</span>
        </label>
        <textarea
          placeholder="請填寫對此申覆案件的回覆意見或最終裁決說明..."
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          disabled={isSubmitting}
          className="w-full h-32 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 leading-relaxed shadow-inner"
        />
      </div>

      {/* Final decision warning */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 leading-relaxed">
          點擊「核准」或「駁回」將設為最終裁決並結案。若僅需回覆溝通，請使用「回覆意見」按鈕。
        </p>
      </div>

      <div className="pt-4 flex flex-wrap justify-end gap-3 border-t border-slate-100">
        {/* Non-final reply */}
        <button
          type="button"
          onClick={handleSubmitResponse}
          disabled={isSubmitting || !responseText.trim()}
          className="px-4 py-2.5 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          回覆意見
        </button>

        {/* Reject (final) */}
        <button
          type="button"
          onClick={handleReject}
          disabled={isSubmitting || !responseText.trim()}
          className="px-4 py-2.5 text-xs font-bold text-white bg-slate-500 hover:bg-slate-600 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <XCircle className="w-4 h-4" />
          駁回結案
        </button>

        {/* Approve (final) */}
        <button
          type="button"
          onClick={handleApprove}
          disabled={isSubmitting || !responseText.trim()}
          className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          核准結案
        </button>
      </div>
    </div>
  );
}
