import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, X } from 'lucide-react';

export default function CurrentKPI() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'standards' | 'results'>('standards');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">2024 年度 Q3 績效指標與評估</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'standards' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('standards')}
        >
          KPI 標準
          {activeTab === 'standards' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-lg"></div>
          )}
        </button>
        <button
          className={`px-6 py-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'results' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('results')}
        >
          考核結果
          {activeTab === 'results' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-lg"></div>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-0 overflow-hidden">
        {activeTab === 'standards' && (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">KPI 名稱</th>
                <th className="px-6 py-4">說明</th>
                <th className="px-6 py-4 w-24">權重</th>
                <th className="px-6 py-4">目標值</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">核心產品開發進度</td>
                <td className="px-6 py-4 text-slate-500">準時完成 Q3 路線圖中的 A、B 模組，代碼審核通過率需達 95% 以上。</td>
                <td className="px-6 py-4 font-medium text-slate-800">40%</td>
                <td className="px-6 py-4 text-slate-500">通過率 {'>'} 95%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">客戶滿意度 (NPS)</td>
                <td className="px-6 py-4 text-slate-500">提升企業端客戶滿意度調查分數，平均得分需達到 8.5 分。</td>
                <td className="px-6 py-4 font-medium text-slate-800">30%</td>
                <td className="px-6 py-4 text-slate-500">NPS {'>'} 8.5</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">團隊技術分享</td>
                <td className="px-6 py-4 text-slate-500">於本季度內主持至少兩次內部技術工作坊或分享會。</td>
                <td className="px-6 py-4 font-medium text-slate-800">15%</td>
                <td className="px-6 py-4 text-slate-500">≥ 2 次</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800">程式碼優化</td>
                <td className="px-6 py-4 text-slate-500">重構現有遺留系統模組，將 API 響應時間縮短 20%。</td>
                <td className="px-6 py-4 font-medium text-slate-800">15%</td>
                <td className="px-6 py-4 text-slate-500">縮短 20%</td>
              </tr>
            </tbody>
          </table>
        )}

        {activeTab === 'results' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">績效總分</h4>
                  <div className="mt-2 text-3xl font-bold text-slate-900">91.5</div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">績效等級</span>
                  <span className="text-lg font-bold text-indigo-600">A-</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">KPI 達成率</h4>
                  <div className="mt-2 text-3xl font-bold text-slate-900">94%</div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">對應分數</span>
                  <span className="text-lg font-bold text-slate-700">94.0</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">主管評核 (問卷分數)</h4>
                  <div className="mt-2 text-3xl font-bold text-slate-900">8.9/10</div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500">對應分數</span>
                  <span className="text-lg font-bold text-slate-700">89.0</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-l-4 border-indigo-600 pl-2">各項 KPI 達成情況</h3>
              
              <div className="space-y-6">
                 {/* Item 1 */}
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                       <div>
                          <span className="font-bold text-slate-800 mr-2">核心產品開發進度</span>
                          <span className="text-xs text-slate-500">(實際值: 5 / 目標值: 4)</span>
                       </div>
                       <span className="font-bold text-slate-800">100%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                       <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                 </div>
                 
                 {/* Item 2 */}
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                       <div>
                          <span className="font-bold text-slate-800 mr-2">客戶滿意度 (NPS)</span>
                          <span className="text-xs text-slate-500">(實際值: 4 / 目標值: 4)</span>
                       </div>
                       <span className="font-bold text-slate-800">88%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                       <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                 </div>

                 {/* Item 3 */}
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                       <div>
                          <span className="font-bold text-slate-800 mr-2">團隊技術分享</span>
                          <span className="text-xs text-slate-500">(實際值: 5 / 目標值: 5)</span>
                       </div>
                       <span className="font-bold text-slate-800 text-orange-500">150%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                       <div className="bg-orange-400 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row items-center justify-between">
               <div className="flex items-center text-sm text-slate-600 mb-4 md:mb-0">
                  <div className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-xs mr-3 flex-shrink-0">i</div>
                  確認後評核結果將正式入檔，若有疑問請於 2025-10-16~2025-10-20 之間提出異議。
               </div>
               <div className="flex space-x-3 w-full md:w-auto">
                  <button 
                    onClick={() => navigate('/dispute', { state: { view: 'submit' } })}
                    className="flex-1 md:flex-none px-4 py-2 border border-slate-300 rounded font-medium text-slate-700 bg-white hover:bg-slate-50 text-sm"
                  >
                     提出績效異議
                  </button>
                  <button 
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 text-sm"
                  >
                     確認評估結果
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <CheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
                確認評估結果
              </h2>
              <button onClick={() => setIsConfirmModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                您確定要確認此次的評估結果嗎？
              </p>
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded flex items-start">
                 <span className="font-bold mr-1">注意：</span>
                 確認後結果將正式入檔且無法再提出異議或修改。
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 border border-slate-300 bg-white rounded font-medium text-slate-700 hover:bg-slate-50 text-sm"
              >
                取消
              </button>
              <button 
                onClick={() => setIsConfirmModalOpen(false)}
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
