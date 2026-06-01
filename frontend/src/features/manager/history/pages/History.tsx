import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User } from 'lucide-react';
import { loadHistoryDataAsync } from '../api';
import type { HistoricalRecord } from '../types';
import HistoryOverview from '../components/HistoryOverview';
import HistoryFilterToolbar from '../components/HistoryFilterToolbar';
import HistoryRecordCard from '../components/HistoryRecordCard';

export default function HistoryPage() {
  const [searchParams] = useSearchParams();
  const initialTeam = searchParams.get('team') || 'all';

  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [teamFilter, setTeamFilter] = useState<string>(initialTeam);
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync state if initialTeam router query parameter changes
  useEffect(() => {
    const queryTeam = searchParams.get('team');
    if (queryTeam) {
      setTeamFilter(queryTeam);
    }
  }, [searchParams]);

  // Load actual evaluations history from backend API
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const { records: fetchedRecords, teams: fetchedTeams } = await loadHistoryDataAsync();
        setRecords(fetchedRecords);
        setTeams(fetchedTeams);
      } catch (err) {
        console.error('Failed to load history data', err);
        setError('載入歷史紀錄失敗，請稍後再試。');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Unique list of periods for dropdown
  const periods = Array.from(new Set(records.map((r) => r.period)));

  // Filter computations
  const filteredRecords = records.filter((rec) => {
    const matchesTeam = teamFilter === 'all' || rec.teamId === teamFilter;
    const matchesPeriod = periodFilter === 'all' || rec.period === periodFilter;
    const matchesUser =
      searchQuery === '' ||
      rec.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.comments.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTeam && matchesPeriod && matchesUser;
  });

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">團隊歷史紀錄彙整</h1>
        <p className="text-slate-500 text-sm mt-1">
          檢視您管轄團隊成員在各個考核週期中，所保留的評級分數、卓越績效表現（Highlights）與考核評語。
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">正在安全地載入團隊歷史考評資料...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm font-bold text-red-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-lg font-bold transition-colors"
          >
            重新整理
          </button>
        </div>
      ) : (
        <>
          {/* Overview Dashboard Blocks */}
          <HistoryOverview filteredRecords={filteredRecords} />

          {/* Toolbar */}
          <HistoryFilterToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            periodFilter={periodFilter}
            setPeriodFilter={setPeriodFilter}
            teams={teams}
            periods={periods}
          />

          {/* List of Historical Cards */}
          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-base font-bold">無歷史紀錄符合篩選條件</p>
              <p className="text-xs">請變更您的搜尋條件或週期過濾器。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <HistoryRecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
