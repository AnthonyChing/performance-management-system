import React from 'react';
import { Calendar, Award, MessageSquare } from 'lucide-react';
import type { HistoricalRecord } from '../types';

interface HistoryRecordCardProps {
  record: HistoricalRecord;
}

export default function HistoryRecordCard({ record }: HistoryRecordCardProps) {
  const gradeColor = record.overallGrade.startsWith('A')
    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : record.overallGrade.startsWith('B')
    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
    : 'bg-amber-100 text-amber-800 border-amber-200';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-colors">
      {/* Header of Record Card */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-1.5 bg-indigo-50 text-indigo-500 rounded-md">
            <Calendar className="w-4 h-4" />
          </span>
          <div>
            <span className="text-xs font-bold text-slate-400">{record.period}</span>
            <h4 className="text-sm font-bold text-slate-700">
              {record.memberName} <span className="font-normal text-xs text-slate-500">({record.role})</span>
            </h4>
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
              <li key={i} className="font-semibold">
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Comments section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-1.5">
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
            主管綜合評語及職涯建議
          </h5>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">「 {record.comments} 」</p>
        </div>
      </div>
    </div>
  );
}
