import { useState } from 'react';
import { Search, CheckCircle2, ChevronDown } from 'lucide-react';
import type { Appeal } from '../types';
import { isAppealOpen } from '../types';
import DisputeStatusBadge from './DisputeStatusBadge';

interface DisputeListSidebarProps {
  appeals: Appeal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

function getInitials(text: string): string {
  if (!text) return '?';
  return text.substring(0, 2);
}

function formatDate(iso: string): string {
  if (!iso) return '';
  return iso.substring(5, 10);
}

export default function DisputeListSidebar({
  appeals,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  isLoading = false,
}: DisputeListSidebarProps) {
  const [showResolved, setShowResolved] = useState(false);

  const openAppeals = appeals.filter((a) => isAppealOpen(a.status));
  const resolvedAppeals = appeals.filter((a) => !isAppealOpen(a.status));

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[700px]">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">申覆案件清單</h2>
          <span className="text-[10px] font-bold text-slate-400">
            {openAppeals.length} 件待處理
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="搜尋案件編號或申覆理由..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* List Body */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {isLoading ? (
          <div className="p-6 text-center text-slate-400 text-xs animate-pulse">
            載入中...
          </div>
        ) : appeals.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            目前沒有符合條件的資料
          </div>
        ) : (
          <>
            {/* Open appeals */}
            {openAppeals.map((appeal) => {
              const isSelected = selectedId === appeal.id;
              return (
                <button
                  key={appeal.id}
                  type="button"
                  onClick={() => onSelect(appeal.id)}
                  className={`w-full text-left p-3 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                      : 'bg-white border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected
                            ? 'bg-indigo-200 text-indigo-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {getInitials(appeal.filed_by_name)}
                      </div>
                      <div className="min-w-0">
                        <h4
                          className={`text-sm font-bold truncate ${
                            isSelected ? 'text-indigo-900' : 'text-slate-800'
                          }`}
                        >
                          {appeal.case_no || appeal.id.substring(0, 8)}
                        </h4>
                        <p
                          className="text-[10px] text-slate-500 line-clamp-1 truncate w-36"
                          title={appeal.reason}
                        >
                          {appeal.reason}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {formatDate(appeal.filed_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <DisputeStatusBadge status={appeal.status} />
                  </div>
                </button>
              );
            })}

            {/* Resolved appeals in collapsible */}
            {resolvedAppeals.length > 0 && (
              <div className="mt-4 border border-slate-100 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowResolved(!showResolved)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    已結案案件 ({resolvedAppeals.length})
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      showResolved ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {showResolved && (
                  <div className="p-2 space-y-1 bg-white border-t border-slate-100">
                    {resolvedAppeals.map((appeal) => {
                      const isSelected = selectedId === appeal.id;
                      return (
                        <button
                          key={appeal.id}
                          type="button"
                          onClick={() => onSelect(appeal.id)}
                          className={`w-full text-left p-3 rounded-lg cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                              : 'bg-white border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isSelected
                                    ? 'bg-indigo-200 text-indigo-700'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {getInitials(appeal.filed_by_name)}
                              </div>
                              <div className="min-w-0">
                                <h4
                                  className={`text-sm font-bold truncate ${
                                    isSelected ? 'text-indigo-900' : 'text-slate-800'
                                  }`}
                                >
                                  {appeal.case_no || appeal.id.substring(0, 8)}
                                </h4>
                                <p
                                  className="text-[10px] text-slate-500 line-clamp-1 truncate w-36"
                                  title={appeal.reason}
                                >
                                  {appeal.reason}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {formatDate(appeal.filed_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <DisputeStatusBadge status={appeal.status} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
