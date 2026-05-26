import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, AlignLeft, CheckCircle2, CheckCircle, X } from 'lucide-react';

export default function Dispute() {
  const location = useLocation();
  const [view, setView] = useState<'submit' | 'list'>(location.state?.view || 'list');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-center mb-6">
         <h1 className="text-2xl font-bold text-slate-800 tracking-tight">績效異議處理 (Performance Dispute Handling)</h1>
         {view === 'list' && (
           <button onClick={() => setView('submit')} className="text-sm px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              發起異議
           </button>
         )}
      </div>

      {view === 'submit' ? (
         <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
               <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">異議說明內容</label>
                  <textarea 
                     className="w-full h-48 p-4 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 text-sm resize-none bg-slate-50/50"
                     defaultValue="關於 2023 Q4 季度績效評核中「專案進度管理」一項被評為「尚可」，我希望能提出異議。在 Q4 期間，我所負責的 Alpha 專案雖然經歷兩次規格異動，但最終仍於 12/20 完成交付，且客戶滿意度達 4.8/5.0。主管評核中提到的進度落後情況，實際上是為確保品質而與技術部門達成共識後的時程調整..."
                  />
               </div>
               
               <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 text-sm shadow-sm"
                  >
                     提交異議申請
                  </button>
               </div>
            </div>
         </div>
      ) : (
         <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="mb-8">
               <div className="flex items-center font-bold text-slate-800 text-lg mb-4 border-b border-slate-200 pb-2">
                  <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                  異議內容 (Dispute Content)
               </div>
               <div className="grid grid-cols-1 gap-4 mb-4 text-sm">
                  <div>
                     <span className="text-slate-400 block mb-1">申訴績效期間</span>
                     <span className="font-medium text-slate-800">2023 年度 Q3 績效考核</span>
                  </div>
               </div>
               <div>
                  <span className="text-slate-400 block mb-2 text-sm">異議說明</span>
                  <div className="bg-slate-50 p-4 rounded text-sm text-slate-700 border border-slate-200 leading-relaxed">
                     本人對於 Q3 考核中「專案領導力」項目的評分（B-）持有異議。 在「Project Phoenix」期間，我成功帶領 5 人跨部門團隊，提前 2 週完成了系統上線，且客戶滿意度得分為 4.8/5.0。 然而考核反饋中提到溝通效率不足，這與專案成功的實際數據與客戶反饋存在落差。 隨附的文件中包含了客戶感謝函以及專案時程紀錄，請相關單位予以核對與重新評估。
                  </div>
               </div>
            </div>

            <div>
               <div className="flex items-center font-bold text-slate-800 text-lg mb-4">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-indigo-600" />
                  區塊 B：異議結果
               </div>
               
               <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-center text-sm">
                     <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                        <tr>
                           <th className="font-medium py-3 px-4">異議編號</th>
                           <th className="font-medium py-3 px-4">提交日期</th>
                           <th className="font-medium py-3 px-4">處理人</th>
                        </tr>
                     </thead>
                     <tbody className="text-slate-800 font-medium">
                        <tr>
                           <td className="py-4 px-4 border-r border-slate-100">DP-20231225-004</td>
                           <td className="py-4 px-4 border-r border-slate-100">2023-12-25 09:42</td>
                           <td className="py-4 px-4">HR 部門 - 陳美玲 (Lin Chen)</td>
                        </tr>
                     </tbody>
                  </table>
               </div>

               <div className="bg-slate-50/50 p-5 rounded-lg border-l-4 border-indigo-600 text-sm">
                  <h4 className="font-semibold text-slate-900 mb-2">處理意見與備註 (Processing Comments)</h4>
                  <p className="text-slate-600 leading-relaxed">
                     系統提示： 您的異議申請已進入人力資源部初步審查。目前正聯繫您的直屬主管就「專案時程調整」的部分進行查證。預計將於 3 個工作日內提供進一步反饋。若有需要補充的會議紀錄或對話截圖，請利用上方的上傳功能進行更新。
                  </p>
               </div>
            </div>
         </div>
      )}

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <CheckCircle className="w-5 h-5 text-indigo-600 mr-2" />
                確認提交異議申請
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                確定要提交績效異議申請嗎？
              </p>
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded flex items-start">
                 <span className="font-bold mr-1">注意：</span>
                 申請提交後將進入人資審核流程，期間無法修改異議內容。
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
                  setView('list');
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
