import { ClipboardList } from 'lucide-react';

export default function EvaluationsEmptyState() {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
      <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <h3 className="text-sm font-bold text-slate-700">目前沒有符合條件的部屬考核</h3>
      <p className="text-xs text-slate-400 mt-1">請調整團隊或搜尋條件後再試一次。</p>
    </div>
  );
}
