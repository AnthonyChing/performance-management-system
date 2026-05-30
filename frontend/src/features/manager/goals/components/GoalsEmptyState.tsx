import { AlertCircle } from 'lucide-react';

export default function GoalsEmptyState() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
      <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-base font-bold">沒有符合當前過濾條件的目標項目</p>
      <p className="text-xs mt-1">請嘗試清除搜尋字詞，或選擇其他組別分類。</p>
    </div>
  );
}
