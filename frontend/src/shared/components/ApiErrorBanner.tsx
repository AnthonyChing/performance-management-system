import { ShieldAlert, AlertTriangle, FileQuestion, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Error codes mapped to their HTTP status for display purposes.
 */
const ERROR_CONFIG: Record<number, {
  icon: typeof ShieldAlert;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  title: string;
  defaultMessage: string;
}> = {
  400: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    title: '欄位驗證錯誤',
    defaultMessage: '請求格式不正確，請檢查輸入資料後重試。',
  },
  403: {
    icon: ShieldAlert,
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    title: '權限不足',
    defaultMessage: '您沒有存取此資源的權限。此頁面僅限直屬主管使用。',
  },
  404: {
    icon: FileQuestion,
    iconColor: 'text-slate-400',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    title: '找不到資源',
    defaultMessage: '找不到您請求的資料，可能已被刪除或移動。',
  },
  409: {
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    title: '狀態衝突',
    defaultMessage: '當前狀態不可執行此操作，可能考核週期已鎖定或異議已結案。',
  },
};

const FALLBACK_CONFIG = {
  icon: AlertTriangle,
  iconColor: 'text-slate-500',
  bgColor: 'bg-slate-50',
  borderColor: 'border-slate-200',
  title: '發生錯誤',
  defaultMessage: '發生非預期的錯誤，請稍後重試。',
};

export interface ApiErrorBannerProps {
  /** HTTP status code (400, 403, 404, 409, etc.) */
  status: number;
  /** Error code from the API (e.g. "FORBIDDEN", "VALIDATION_ERROR") */
  code?: string;
  /** Human-readable error message from the API */
  message?: string;
  /** Detailed field-level errors */
  details?: Array<{ field?: string; message: string }>;
  /** Whether to show the full-page layout (centered with back/retry buttons) vs inline banner */
  fullPage?: boolean;
  /** Optional retry callback — shows a retry button when provided */
  onRetry?: () => void;
}

/**
 * Shared error display for API errors (400, 403, 404, 409).
 *
 * - `fullPage` mode: centered layout with icon, title, message, and navigation buttons.
 *   Best for 403 "forbidden" full-page blocks.
 * - Inline (default): compact banner suitable for embedding within an existing page.
 */
export default function ApiErrorBanner({
  status,
  code,
  message,
  details,
  fullPage = false,
  onRetry,
}: ApiErrorBannerProps) {
  const navigate = useNavigate();
  const config = ERROR_CONFIG[status] ?? FALLBACK_CONFIG;
  const Icon = config.icon;
  const displayMessage = message || config.defaultMessage;

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[480px] text-center px-6 py-12">
        <div className={`w-16 h-16 rounded-2xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center mb-6`}>
          <Icon className={`w-8 h-8 ${config.iconColor}`} />
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">{config.title}</h2>

        {code && (
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-500 rounded mb-3">
            {status} · {code}
          </span>
        )}

        <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-2">
          {displayMessage}
        </p>

        {details && details.length > 0 && (
          <div className="mt-2 w-full max-w-sm text-left">
            {details.map((d, i) => (
              <div
                key={`${d.field ?? ''}-${i}`}
                className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-1"
              >
                {d.field && (
                  <span className="font-bold text-slate-700 mr-1">{d.field}:</span>
                )}
                {d.message}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回上一頁
          </button>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重試
            </button>
          )}
        </div>
      </div>
    );
  }

  // Inline banner mode
  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-xl p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-slate-800">{config.title}</h4>
            {code && (
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white/60 text-slate-500 rounded">
                {status} · {code}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{displayMessage}</p>

          {details && details.length > 0 && (
            <div className="mt-2 space-y-1">
              {details.map((d, i) => (
                <div
                  key={`${d.field ?? ''}-${i}`}
                  className="text-[11px] text-slate-600 bg-white/50 border border-slate-100 rounded px-2 py-1"
                >
                  {d.field && (
                    <span className="font-bold text-slate-700 mr-1">{d.field}:</span>
                  )}
                  {d.message}
                </div>
              ))}
            </div>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              重試
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
