import React, { useState } from 'react';
import { AlignLeft, MessageSquare, Edit3, Rocket, Calendar, X, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { StatusType, Goal } from '../../types';

const StatusBadge = ({ status }: { status: StatusType }) => {
  const styles = {
    '進行中': 'bg-green-100 text-green-700',
    '待審核': 'bg-yellow-100 text-yellow-700',
    '草稿': 'bg-slate-100 text-slate-600',
    '已完成': 'bg-indigo-100 text-indigo-700',
    '待處理': 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-4 ${styles[status]}`}>
      {status}
    </span>
  );
};

export default function GoalDetail() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(80);

  return (
    <div className="w-full max-w-4xl relative">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center mb-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">提升 Q3 季度客戶滿意度至 92%</h1>
            <StatusBadge status="進行中" />
          </div>
          <div className="flex items-center text-sm text-slate-500 font-medium">
             <Calendar className="w-4 h-4 mr-1.5" />
             截止日期： 2023年9月30日
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/goals/edit/1" className="flex items-center px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 shadow-sm">
            <Edit3 className="w-4 h-4 mr-2" />
            修改目標
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm"
          >
            <Rocket className="w-4 h-4 mr-2" />
            更新進度
          </button>
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
            主管審核回饋
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

      {/* Progress Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">更新目標進度</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">GOAL NAME</p>
                <p className="text-sm font-bold text-slate-800 mb-4">提升 Q3 季度客戶滿意度至 92%</p>
                
                <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                  <span>目前進度: 75%</span>
                  <div className="flex items-center text-right">
                    <span className="font-bold text-slate-800 mr-4 text-sm">75%</span>
                    <div className="flex flex-col">
                       <span className="text-[10px]">上次更新</span>
                       <span className="font-bold text-slate-800">2023-08-15</span>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 flex overflow-hidden">
                  <div className="bg-indigo-600 h-1.5 rounded-l-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">設置新進度</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <div className="flex items-center gap-2 border border-slate-300 rounded overflow-hidden">
                     <input 
                       type="number" 
                       value={progress} 
                       onChange={(e) => setProgress(parseInt(e.target.value))}
                       className="w-16 p-2 text-center text-sm font-bold text-slate-800 outline-none"
                     />
                     <span className="text-sm text-slate-500 font-bold bg-slate-50 px-3 py-2 border-l border-slate-300">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">進度說明與備註</label>
                <textarea 
                  className="w-full h-24 p-3 text-sm border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="描述當前狀態、取得的成就或面臨的挑戰..."
                ></textarea>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-white border border-slate-300 rounded font-medium text-slate-700 hover:bg-slate-50 text-sm"
              >
                取消
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex items-center px-6 py-2 bg-[#0c4a8f] text-white rounded font-medium hover:bg-[#09366e] text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                確認更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
