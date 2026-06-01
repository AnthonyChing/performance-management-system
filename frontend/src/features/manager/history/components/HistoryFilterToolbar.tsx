import React from 'react';
import { Search } from 'lucide-react';

interface HistoryFilterToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  teamFilter: string;
  setTeamFilter: (team: string) => void;
  periodFilter: string;
  setPeriodFilter: (period: string) => void;
  teams: Array<{ id: string; name: string }>;
  periods: string[];
}

export default function HistoryFilterToolbar({
  searchQuery,
  setSearchQuery,
  teamFilter,
  setTeamFilter,
  periodFilter,
  setPeriodFilter,
  teams,
  periods,
}: HistoryFilterToolbarProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="搜尋姓名或考核評語..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg pl-9 pr-4 py-2.5 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Team Filter */}
      <div>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:bg-white"
        >
          <option value="all">所有團隊組別</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Period Filter */}
      <div>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="w-full bg-slate-50 text-xs text-slate-700 rounded-lg px-3 py-2.5 border border-slate-200 outline-none focus:bg-white"
        >
          <option value="all">所有考核歷史週期</option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Action instruction */}
      <div className="flex items-center justify-end text-xs text-slate-400 font-bold">
        已連線至核心系統資料庫
      </div>
    </div>
  );
}
