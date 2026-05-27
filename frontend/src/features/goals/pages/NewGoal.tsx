import React, { useState } from 'react';
import { AlignLeft, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NewGoal() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <div className="w-full max-w-4xl relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">新增個人目標</h1>
        <p className="text-slate-500 text-sm">請定義您的下一階段目標。</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b border-slate-100 flex items-center text-slate-900 font-semibold bg-slate-50/50">
          <AlignLeft className="w-5 h-5 mr-3 text-indigo-600" />
          基本目標資訊
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              目標名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="例如：提升產品技術文件完整度"
              className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 text-sm transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              預計達成時間 (截止日期) <span className="text-red-500">*</span>
            </label>
            <input
               type="date"
               className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 text-sm transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              目標說明 <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full h-40 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 text-sm resize-none transition-shadow"
              placeholder="詳細描述此目標的背景、執行方式與預期價值..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button 
          onClick={() => navigate('/goals/current')}
          className="px-6 py-2.5 border border-slate-300 rounded-md font-medium text-slate-700 bg-white hover:bg-slate-50 text-sm transition-colors"
        >
          取消建立
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 text-sm shadow-sm transition-colors"
        >
          提交並送審
        </button>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <CheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
                確認提交目標審核
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                確定要提交此目標並送出審核嗎？
              </p>
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded flex items-start">
                 <span className="font-bold mr-1">注意：</span>
                 送出後將由直屬主管進行審批，審核期間您暫時無法編輯此目標內容。
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 bg-white rounded font-medium text-slate-700 hover:bg-slate-50 text-sm"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  navigate('/goals/current');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 text-sm"
              >
                確認提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
