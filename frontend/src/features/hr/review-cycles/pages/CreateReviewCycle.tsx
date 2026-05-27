import React, { useState } from 'react';
import { Calendar, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateReviewCycle() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="w-full max-w-3xl mx-auto pb-12">
      <div className="flex items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">新增考核週期</h1>
          <p className="text-sm text-slate-500 mt-1">設定新的考核週期區間與發布時間。</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">REVIEW CYCLE NAME</label>
              <input 
                type="text" 
                className="w-full border border-slate-300 rounded-md xl:py-2.5 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm"
                placeholder="例如：2024 年度年度績效考核"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">週期類型</label>
              <select className="w-full border border-slate-300 rounded-md xl:py-2.5 py-2 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm appearance-none">
                <option>年度考核</option>
                <option>季度考核</option>
                <option>專案考核</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">REVIEW PERIOD RANGE</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="date" className="w-full pl-9 pr-3 xl:py-2.5 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2544]" />
                </div>
                <span className="text-slate-400 font-medium text-sm">至</span>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="date" className="w-full pl-9 pr-3 xl:py-2.5 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2544]" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">MANAGER EVALUATION PERIOD</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="date" className="w-full pl-9 pr-3 xl:py-2.5 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2544]" />
                </div>
                <span className="text-slate-400 font-medium text-sm">至</span>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="date" className="w-full pl-9 pr-3 xl:py-2.5 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2544]" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">績效異議時段</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 border-2 border-slate-400 rounded-full flex items-center justify-center font-bold text-[10px] pointer-events-none">!</div>
                  <input type="date" className="w-full pl-9 pr-3 xl:py-2.5 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2544]" />
                </div>
                <span className="text-slate-400 font-medium text-sm">至</span>
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 border-2 border-slate-400 rounded-full flex items-center justify-center font-bold text-[10px] pointer-events-none">!</div>
                  <input type="date" className="w-full pl-9 pr-3 xl:py-2.5 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2544]" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">RESULTS ANNOUNCEMENT DATE</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M3 15h6"/><path d="M3 18h6"/></svg>
                </div>
                <input type="date" className="w-full pl-9 pr-3 xl:py-2.5 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2544]" />
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50 p-4 border border-slate-200 rounded-lg">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                提示：請確保所有日期均在考核週期之後。建立後，系統將自動通知所有相關經理與員工。
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end items-center gap-3">
          <button 
            onClick={() => setShowConfirm(true)}
            className="px-8 py-2 bg-[#0B2544] text-white rounded font-bold text-sm hover:bg-[#13335A] transition-colors shadow-sm"
          >
            建立
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">確認建立</h2>
              <button 
                onClick={() => setShowConfirm(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm">確定要建立此考核週期嗎？建立後將回到列表頁面。</p>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end items-center gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => navigate('/hr/cycles')}
                className="px-5 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm"
              >
                確定建立
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
