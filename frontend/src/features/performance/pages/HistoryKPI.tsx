import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HISTORY_KPI_MOCK } from '../../../shared/api/mockData';

export default function HistoryKPI() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">歷史 KPI 列表</h1>
        <p className="text-slate-500 text-sm mt-1">查閱過去所有考核週期的績效數據與最終評分</p>
      </div>

      <div className="space-y-4 mb-8">
        {HISTORY_KPI_MOCK.map((item) => (
          <div key={item.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex-1 mb-4 md:mb-0">
              <h3 className="text-lg font-bold text-slate-800">{item.period}</h3>
              <p className="text-xs text-slate-500 mt-1">考核區間：{item.dates}</p>
            </div>
            
            <div className="flex items-center space-x-12">
              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium mb-1">總分</p>
                <p className="text-2xl font-bold text-slate-800">{item.totalScore}</p>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="text-center">
                 <p className="text-xs text-slate-500 font-medium mb-1">最終等級</p>
                 <span className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-lg font-bold ${item.gradeColor}`}>
                    {item.grade}
                 </span>
              </div>
              
              <Link to={`/performance/history/${item.id}`} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 ml-4 group">
                查看詳情
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-2">
        <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded bg-indigo-600 text-white font-medium text-sm">1</button>
        <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm">2</button>
        <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm">3</button>
        <span className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>
        <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm">5</button>
        <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
