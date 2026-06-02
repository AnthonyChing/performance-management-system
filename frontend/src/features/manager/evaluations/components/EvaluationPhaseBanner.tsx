import { AlertCircle, Lock } from 'lucide-react';

interface EvaluationPhaseBannerProps {
  editable: boolean;
  lockReason: string | null;
}

export default function EvaluationPhaseBanner({ editable, lockReason }: EvaluationPhaseBannerProps) {
  if (editable) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-900">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
        <div>
          <p className="font-bold">主管評核階段</p>
          <p className="mt-1 text-indigo-800/80 leading-relaxed">
            您可暫存問卷與 KPI 數值。完成全部必填項目後，再提交最終評核結果。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/70 p-4 text-xs text-rose-900">
      <Lock className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
      <div>
        <p className="font-bold">目前不可編輯</p>
        <p className="mt-1 text-rose-800/80 leading-relaxed">
          {lockReason ?? '此考核不在主管評核階段，無法修改內容。'}
        </p>
      </div>
    </div>
  );
}
