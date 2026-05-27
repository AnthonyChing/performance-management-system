import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  History, 
  Search, 
  Filter, 
  Award, 
  ChevronRight, 
  User, 
  Calendar,
  MessageSquare,
  BarChart2,
  Bookmark
} from 'lucide-react';
import { loadManagerData, HISTORICAL_DB } from '../api';
import type { TeamMember, HistoricalRecord } from '../types';

export default function HistoryPage() {
  const [searchParams] = useSearchParams();
  const initialTeam = searchParams.get('team') || 'all';

  const [data, setData] = useState(() => loadManagerData());
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

  // Unique list of periods for dropdown
  const periods = Array.from(new Set(HISTORICAL_DB.map(r => r.period)));

  // Filter computations
  const filteredRecords = HISTORICAL_DB.filter(rec => {
    const matchesTeam = teamFilter === 'all' || rec.teamId === teamFilter;
    const matchesPeriod = periodFilter === 'all' || rec.period === periodFilter;
    const matchesUser = searchQuery === '' || 
      rec.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.comments.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTeam && matchesPeriod && matchesUser;
  });

  // Aggregate statistics for active selection
  const avgScore = filteredRecords.length > 0 
    ? Math.round(filteredRecords.reduce((acc, curr) => acc + curr.score, 0) / filteredRecords.length * 10) / 10
    : 0;

  // Grade distributions count
  const gradeCounts = filteredRecords.reduce((acc, curr) => {
    acc[curr.overallGrade] = (acc[curr.overallGrade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gradeKeys: ('A' | 'A-' | 'B+' | 'B' | 'B-' | 'C')[] = ['A', 'A-', 'B+', 'B', 'B-', 'C'];
  const maxGradeCount = Math.max(...gradeKeys.map(k => gradeCounts[k] || 0), 1);

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">團隊歷史紀錄彙整</h1>
        <p className="text-slate-500 text-sm mt-1">
          檢視您管轄團隊成員在各個考核週期中，所保留的評級分數、卓越績效表現（Highlights）與考核評語。
        </p>
      </div>

      {/* Overview Dashboard Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Stats Widget */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 inline-block mb-3">
              <History className="w-5 h-5" />
            </span>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">當前依條件彙整</h4>
            <p className="text-2xl font-extrabold text-slate-800 mt-2 font-mono">
              {filteredRecords.length} <span className="text-xs text-slate-500 font-normal">筆紀錄</span>
            </p>
            
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>平均分數</span>
                <span className="font-bold text-indigo-600 font-mono text-sm">{avgScore} / 100</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>頂尖/A級比例</span>
                <span className="font-bold text-emerald-600">
                  {filteredRecords.length > 0 
                    ? Math.round(((gradeCounts['A'] || 0) + (gradeCounts['A-'] || 0)) / filteredRecords.length * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-400 mt-4 italic border-t border-slate-50 pt-2">
            * 考核資料為歷史週期已定案保存數據
          </div>
        </div>

        {/* Right Distribution SVG Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm lg:col-span-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <BarChart2 className="w-4 h-4 text-emerald-500" />
              考核等第分佈圖 (Grade Distribution)
            </h3>
            <p className="text-xs text-slate-400">當前過濾範圍下，考績等第的員工數量分佈。</p>
          </div>

          {/* SVG Custom Premium Vector Chart */}
          <div className="my-4 h-28 flex items-end gap-3 px-4">
            {gradeKeys.map(grade => {
              const count = gradeCounts[grade] || 0;
              const percent = (count / maxGradeCount) * 100;
              
              return (
                <div key={grade} className="flex-1 flex flex-col items-center group">
                  <span className="text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">
                    {count}人
                  </span>
                  
                  {/* Glowing Bar */}
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-t-lg overflow-hidden h-20 flex items-end">
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-500 ${grade.startsWith('A') ? 'bg-emerald-400' : grade.startsWith('B') ? 'bg-indigo-400' : 'bg-amber-400'}`}
                      style={{ height: `${percent || 4}%` }}
                    ></div>
                  </div>
                  
                  <span className="text-xs font-bold text-slate-600 mt-2 font-mono">
                    {grade}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 text-[10px] text-slate-400 font-semibold justify-end border-t border-slate-50 pt-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm"></span> A級等第</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-400 rounded-sm"></span> B級等第</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-sm"></span> C級等第</span>
          </div>

        </div>

      </div>

      {/* Toolbar */}
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
            {data.teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
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
            {periods.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Action instruction */}
        <div className="flex items-center justify-end text-xs text-slate-400 font-bold">
          已連線至核心系統資料庫
        </div>

      </div>

      {/* List of Historical Cards */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-base font-bold">無歷史紀錄符合篩選條件</p>
          <p className="text-xs">請變更您的搜尋條件或週期過濾器。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const gradeColor = record.overallGrade.startsWith('A') 
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : record.overallGrade.startsWith('B')
              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
              : 'bg-amber-100 text-amber-800 border-amber-200';

            return (
              <div 
                key={record.id} 
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-colors"
              >
                {/* Header of Record Card */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="p-1.5 bg-indigo-50 text-indigo-500 rounded-md">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-400">{record.period}</span>
                      <h4 className="text-sm font-bold text-slate-700">{record.memberName} <span className="font-normal text-xs text-slate-500">({record.role})</span></h4>
                    </div>
                  </div>

                  {/* Rating Grade display */}
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold font-mono">綜合得分 {record.score} 分</p>
                      <p className="text-xs text-slate-500">考評等級</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-extrabold rounded-md border font-mono ${gradeColor}`}>
                      {record.overallGrade}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  
                  {/* Highlights section */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      本期卓越亮點（Highlight KPIs）
                    </h5>
                    <ul className="list-inside list-disc pl-2 space-y-1.5 text-xs text-slate-600">
                      {record.highlightKpis.map((h, i) => (
                        <li key={i} className="font-semibold">{h}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Comments section */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-1.5">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                      主管綜合評語及職涯建議
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      「 {record.comments} 」
                    </p>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
