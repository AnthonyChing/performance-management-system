import React from 'react';
import { Info, List, Plus, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateQuestionnaire() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">建立新的問卷模板</h1>
        <p className="text-sm text-slate-500 mt-1">請輸入模板的基本資訊並規劃評估問題。</p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Info className="w-5 h-5 text-[#0B2544]" />
            <h2 className="text-lg font-bold text-slate-800">基本資訊 (Basic Information)</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  模板名稱 (Template Name) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm"
                  placeholder="例如：2024 年度員工績效評估"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  模板分類 (Category)
                </label>
                <select className="w-full border border-slate-300 rounded-md py-2.5 px-3 bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm">
                  <option>年度評核</option>
                  <option>季度目標</option>
                  <option>試用期評估</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                模板說明 (Description)
              </label>
              <textarea 
                rows={4}
                className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm resize-none"
                placeholder="請輸入此問卷的使用場景與填寫指引..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Question Management */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-[#0B2544]" />
              <h2 className="text-lg font-bold text-slate-800">問題管理 (Question Management)</h2>
            </div>
            <button className="flex items-center px-4 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#0B2544]">
              <Plus className="w-4 h-4 mr-2" />
              新增問題
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Question 1 */}
            <div className="border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">Q1</span>
                    <button className="flex items-center px-2 py-0.5 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 text-[10px] font-medium transition-colors">
                      <PenTool className="w-3 h-3 mr-1" /> 編輯
                    </button>
                    <span className="px-2 py-0.5 border border-slate-200 rounded text-slate-600 text-[10px] font-medium bg-slate-50">
                      必填
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">您的核心工作目標達成率為何？</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium mb-1">問題類型</div>
                  <div className="text-sm font-bold text-slate-700">單選題 (Rating)</div>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded p-4 flex items-center justify-between">
                <div className="flex-1 flex justify-between items-center mr-8 text-xs text-slate-500">
                  <span>1 - 未達標</span>
                  <div className="flex-1 px-4 flex gap-1">
                    <div className="h-1.5 flex-1 bg-slate-200 rounded-full"></div>
                    <div className="h-1.5 flex-1 bg-slate-200 rounded-full"></div>
                    <div className="h-1.5 flex-1 bg-slate-200 rounded-full"></div>
                  </div>
                  <span>3 - 符合預期</span>
                </div>
                <div className="text-right border-l border-slate-200 pl-4 w-28 shrink-0">
                  <div className="text-xs text-slate-500 font-medium mb-0.5">選項數</div>
                  <div className="font-bold text-[#0B2544] text-sm tracking-wide">3 Options</div>
                </div>
              </div>
            </div>

            {/* Question 2 */}
            <div className="border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded">Q2</span>
                    <button className="flex items-center px-2 py-0.5 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 text-[10px] font-medium transition-colors">
                      <PenTool className="w-3 h-3 mr-1" /> 編輯
                    </button>
                    <span className="px-2 py-0.5 border border-slate-200 rounded text-slate-600 text-[10px] font-medium bg-slate-50">
                      選填
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">請具體描述過去三個月的主要貢獻</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium mb-1">問題類型</div>
                  <div className="text-sm font-bold text-slate-700">開放式簡答 (Text)</div>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded p-4 text-sm text-slate-400 italic flex items-center">
                預覽區域：輸入框將在此顯示...
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end items-center gap-3">
        <button 
          onClick={() => navigate('/hr/questionnaires')}
          className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded hover:bg-slate-50 transition-colors"
        >
          暫存 (Save as Draft)
        </button>
        <button 
          onClick={() => navigate('/hr/questionnaires')}
          className="px-6 py-2.5 bg-[#0B2544] text-white font-bold text-sm rounded hover:bg-[#13335A] transition-colors shadow-sm"
        >
          建立模板 (Create Template)
        </button>
      </div>
    </div>
  );
}
