import React from 'react';
import { MessageSquare, Calendar } from 'lucide-react';

export default function HistoryGoalDetail() {
  return (
    <div className="w-full max-w-4xl relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center mb-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">提升 Q3 季度客戶滿意度至 92% <span className="font-normal text-slate-600 text-lg">（所屬考核週期：2024年度考核）</span></h1>
          </div>
          <div className="flex items-center text-sm text-slate-500 font-medium">
             <Calendar className="w-4 h-4 mr-1.5" />
             截止日期： 2023年9月30日
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6 p-6">
         <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">目標說明</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
               透過優化售後服務流程及縮短工單處理時間，計畫在第三季度將 CSAT (客戶滿意度) 分數從 88% 提升至 92%。此目標直接關聯到年度「卓越服務」戰略支柱。
            </p>
         </div>

         <div>
            <div className="flex justify-between items-end mb-2 border-t border-slate-100 pt-6">
               <h3 className="text-sm font-semibold text-slate-800">當前進度狀態</h3>
               <span className="text-2xl font-bold text-slate-900">75%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-6">
               <div className="bg-indigo-600 h-3 rounded-full" style={{ width: '75%' }}></div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="w-full sm:w-1/3 shrink-0">
                     <span className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">上次更新時間</span>
                     <span className="text-sm font-medium text-slate-800">2023-08-15 14:30</span>
                  </div>
                  <div className="w-full sm:flex-1">
                     <span className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">備註</span>
                     <p className="text-sm text-slate-700 leading-relaxed">
                        目前已完成第一階段優化計畫的初步評估與資源盤點，客戶滿意度調查問卷已發放。下一階段將根據反饋進行調整。
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-6">
         <div className="flex items-center text-slate-800 font-bold mb-4">
            <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
            主管回饋
         </div>

         <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-indigo-600">
            <div className="flex justify-between items-center mb-2">
               <span className="text-sm font-bold text-indigo-900">李曉芳 (Director)</span>
               <span className="text-xs text-slate-400 font-medium">2023-08-10</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
               目前進度非常理想。在優化客戶服務流程後，初步數據顯示滿意度已有回升。請繼續保持並確保在接下來的營運週會中分享初步成果。
            </p>
         </div>
      </div>
    </div>
  );
}
