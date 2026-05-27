import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, Clock, User, FileText, Settings } from 'lucide-react';
import { HR_MOCK_LOGS } from '../api';

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredLogs = HR_MOCK_LOGS.filter(log => {
    const matchesSearch = log.user.includes(searchQuery) || log.action.includes(searchQuery) || log.resource.includes(searchQuery);
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return <Settings className="w-4 h-4 text-slate-500" />;
      case 'evaluation': return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'dispute': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'template': return <FileText className="w-4 h-4 text-emerald-500" />;
      case 'goal': return <FileText className="w-4 h-4 text-amber-500" />;
      default: return <Settings className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'evaluation': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'dispute': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'template': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'goal': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

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
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        {log.user}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${getTypeColor(log.type)}`}>
                        {getTypeIcon(log.type)}
                        {log.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]" title={log.resource}>
                      {log.resource}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
                      {log.ip}
                    </td>
                  </tr>
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
        
        {/* Pagination mock */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>共 {filteredLogs.length} 筆紀錄</span>
          <div className="flex gap-1">
            <button className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-400 cursor-not-allowed">上一頁</button>
            <button className="px-2 py-1 rounded border border-indigo-200 bg-indigo-50 text-indigo-600 font-bold">1</button>
            <button className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50">下一頁</button>
          </div>
        </div>
      </div>
    </div>
  );
}
