import { ClipboardList } from 'lucide-react';

interface DisputeEmptyStateProps {
  message?: string;
  hint?: string;
}

export default function DisputeEmptyState({
  message = '無選取的申覆案件',
  hint = '請由左方列表點選一項以查看詳細內容並進行裁決。',
}: DisputeEmptyStateProps) {
  return (
    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-xl border border-slate-200 border-dashed">
      <ClipboardList className="w-12 h-12 text-slate-300 mb-4" />
      <h3 className="text-sm font-bold text-slate-500">{message}</h3>
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}
