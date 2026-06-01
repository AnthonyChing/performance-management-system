import React, { useEffect, useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { listAuditLogs } from '../api';
import AuditLogTableRow, { AuditLogItem, getLogCategory } from '../components/AuditLogTableRow';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await listAuditLogs({
        page,
        page_size: 20,
      });

      const rawLogs = (response.data || []) as any[];
      
      // Map to frontend AuditLogItem format
      const formatted: AuditLogItem[] = rawLogs.map(item => ({
        id: item.id,
        actorId: item.actor_id || item.actorId,
        actorName: item.actor_name || item.actorName,
        action: item.action,
        resource: item.resource,
        resourceId: item.resource_id || item.resourceId,
        oldValue: item.old_value || item.oldValue,
        newValue: item.new_value || item.newValue,
        ipAddress: item.ip_address || item.ipAddress,
        createdAt: item.created_at || item.createdAt,
      }));

      setLogs(formatted);

      if (response.meta) {
        setTotalPages(response.meta.total_pages || 1);
        setTotalCount(response.meta.total_count || formatted.length);
      }
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      setError(err?.message || '無法下載稽核紀錄，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const filteredLogs = logs.filter(log => {
    const name = log.actorName || '系統/未知操作者';
    const matchesSearch = 
      searchQuery === '' || 
      name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.resource.toLowerCase().includes(searchQuery.toLowerCase());

    const category = getLogCategory(log.action);
    const matchesType = typeFilter === 'all' || category === typeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">查詢稽核紀錄</h1>
          <p className="text-slate-500 text-sm mt-1">追蹤系統內的所有重要操作與變更，以確保資料安全與考核公正性。</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋操作者、動作或資源名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-sm text-slate-700 rounded-lg pl-9 pr-4 py-2 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 text-sm text-slate-700 rounded-lg px-3 py-2 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">所有類別</option>
              <option value="system">系統與發佈操作</option>
              <option value="evaluation">評分與考核</option>
              <option value="dispute">異議申覆</option>
              <option value="template">模板與設定</option>
              <option value="goal">目標與 KPI</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center border border-slate-200 rounded-xl bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-500">正在下載稽核紀錄...</span>
          </div>
        </div>
      ) : error ? (
        <div className="w-full p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <h4 className="font-bold">載入失敗</h4>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">操作時間</th>
                  <th className="px-6 py-4">操作者</th>
                  <th className="px-6 py-4">事件類別</th>
                  <th className="px-6 py-4">動作</th>
                  <th className="px-6 py-4">操作資源 / 內容</th>
                  <th className="px-6 py-4 text-right">來源 IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => (
                    <AuditLogTableRow key={log.id} log={log} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      找不到符合條件的紀錄
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              第 {page} 頁 / 共 {totalPages} 頁 (共 {totalCount} 筆紀錄)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className={`px-3 py-1 rounded border text-slate-600 transition-colors bg-white hover:bg-slate-50 border-slate-200
                  ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                上一頁
              </button>
              
              <button
                disabled
                className="px-3 py-1 rounded border border-indigo-200 bg-indigo-50 text-indigo-600 font-bold"
              >
                {page}
              </button>
              
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className={`px-3 py-1 rounded border text-slate-600 transition-colors bg-white hover:bg-slate-50 border-slate-200
                  ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                下一頁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
