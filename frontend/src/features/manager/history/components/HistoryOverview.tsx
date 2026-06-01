import React from 'react';
import { History as HistoryIcon, BarChart2 } from 'lucide-react';
import type { HistoricalRecord } from '../types';

interface HistoryOverviewProps {
  filteredRecords: HistoricalRecord[];
}

export default function HistoryOverview({ filteredRecords }: HistoryOverviewProps) {
  // Aggregate statistics for active selection
  const avgScore =
    filteredRecords.length > 0
      ? Math.round((filteredRecords.reduce((acc, curr) => acc + curr.score, 0) / filteredRecords.length) * 10) / 10
      : 0;

  // Grade distributions count
  const gradeCounts = filteredRecords.reduce((acc, curr) => {
    acc[curr.overallGrade] = (acc[curr.overallGrade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gradeKeys: ('A' | 'A-' | 'B+' | 'B' | 'B-' | 'C')[] = ['A', 'A-', 'B+', 'B', 'B-', 'C'];
  const maxGradeCount = Math.max(...gradeKeys.map((k) => gradeCounts[k] || 0), 1);

  const topGradeCount = (gradeCounts['A'] || 0) + (gradeCounts['A-'] || 0);
  const topGradePercent =
    filteredRecords.length > 0 ? Math.round((topGradeCount / filteredRecords.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Stats Widget */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 inline-block mb-3">
            <HistoryIcon className="w-5 h-5" />
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
              <span className="font-bold text-emerald-600">{topGradePercent}%</span>
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
          {gradeKeys.map((grade) => {
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
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      grade.startsWith('A')
                        ? 'bg-emerald-400'
                        : grade.startsWith('B')
                        ? 'bg-indigo-400'
                        : 'bg-amber-400'
                    }`}
                    style={{ height: `${percent || 4}%` }}
                  ></div>
                </div>

                <span className="text-xs font-bold text-slate-600 mt-2 font-mono">{grade}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 text-[10px] text-slate-400 font-semibold justify-end border-t border-slate-50 pt-2">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm"></span> A級等第
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-indigo-400 rounded-sm"></span> B級等第
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm"></span> C級等第
          </span>
        </div>
      </div>
    </div>
  );
}
