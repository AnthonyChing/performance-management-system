import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, FileText, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { HR_CREATE_TEMPLATE_QUESTIONNAIRES, HR_CREATE_TEMPLATE_STEPS } from '../api';

export default function CreateTemplate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [selectedQuestionnaires, setSelectedQuestionnaires] = useState<{name: string, weight: number}[]>([]);
  const questionnairesList = HR_CREATE_TEMPLATE_QUESTIONNAIRES;
  const steps = HR_CREATE_TEMPLATE_STEPS;

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2544] tracking-tight">建立考核模板作業</h1>
        <p className="text-sm text-slate-500 mt-1">請依照引導步驟完成考核模板設定。</p>
      </div>

      {/* Stepper */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center min-w-max py-4 px-2">
          {steps.map((s, idx) => {
            const stepNum = idx + 1;
            const isCompleted = step > stepNum;
            const isActive = step === stepNum;
            return (
              <React.Fragment key={stepNum}>
                <div className="flex flex-col items-center relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10 
                    ${isCompleted ? 'bg-[#0B2544] text-white' : isActive ? 'bg-[#0B2544] text-white shadow-md ring-4 ring-indigo-50' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
                  </div>
                  <div className={`mt-3 text-sm font-bold ${isActive || isCompleted ? 'text-[#0B2544]' : 'text-slate-400'}`}>
                    {s.title}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 w-24 mx-4 ${isCompleted ? 'bg-[#0B2544]' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Forms */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-2">考核基本資料設定</h2>
            <p className="text-sm text-slate-500 mb-8">請填寫本次考核的基本資訊與適用範圍。</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">考核名稱</label>
                <input type="text" className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm" defaultValue="2024 年度研發部門績效考核 (複製)" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">說明</label>
                <textarea rows={4} className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm" defaultValue="此為從 2024 年度週期複製建立之考核，用於研發部門特定績效追蹤。" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">選擇已建立的員工群組</label>
                <div className="relative">
                  <select className="w-full border border-slate-300 rounded-md py-2.5 px-3 bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent">
                    <option>技術研發部</option>
                    <option>全體員工</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center rounded-b-lg">
            <button onClick={() => navigate('/hr/templates')} className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">取消</button>
            <button onClick={() => setStep(2)} className="flex items-center px-6 py-2.5 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#0B2544]">
              下一步 <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-2">選擇問卷範本</h2>
            <p className="text-sm text-slate-500 mb-8">請從系統已建立的範本庫中選擇適合本次績效評估的問卷。</p>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">選擇已建立的問卷範本</label>
              <div className="relative">
                <div 
                  className="w-full border border-slate-300 rounded-md py-2.5 px-3 bg-white flex justify-between items-center cursor-pointer focus-within:ring-2 focus-within:ring-[#0B2544] focus-within:border-transparent"
                  onClick={() => {
                    setTempSelected(selectedQuestionnaires.map(q => q.name));
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                >
                  <span className={selectedQuestionnaires.length > 0 ? "text-slate-800" : "text-slate-400"}>
                    {selectedQuestionnaires.length > 0 ? `已選擇 ${selectedQuestionnaires.length} 個範本` : '請選擇範本...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-20 overflow-hidden flex flex-col">
                    <div className="max-h-60 overflow-y-auto py-1">
                      {questionnairesList.map(q => (
                         <label key={q} className="flex items-center px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                           <input 
                             type="checkbox" 
                             className="mr-3 w-4 h-4 text-[#0B2544] border-gray-300 rounded focus:ring-[#0B2544]" 
                             checked={tempSelected.includes(q)}
                             onChange={(e) => {
                               if(e.target.checked) setTempSelected([...tempSelected, q]);
                               else setTempSelected(tempSelected.filter(i => i !== q));
                             }}
                           />
                           <span className="text-sm text-slate-700 font-medium">{q}</span>
                         </label>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 p-3 bg-slate-50 flex justify-end gap-2 shrink-0">
                      <button 
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                      >
                        取消
                      </button>
                      <button 
                        onClick={() => {
                          const newSelected = tempSelected.map(name => {
                            const existing = selectedQuestionnaires.find(sq => sq.name === name);
                            return existing ? existing : { name, weight: 0 };
                          });
                          setSelectedQuestionnaires(newSelected);
                          setIsDropdownOpen(false);
                        }}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-[#0B2544] rounded hover:bg-[#13335A] transition-colors"
                      >
                        確定
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedQuestionnaires.length === 0 ? (
               <div className="mt-8 border-2 border-dashed border-slate-200 rounded-lg p-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                 <FileText className="w-12 h-12 mb-4 text-slate-300" />
                 <div className="text-lg font-bold text-slate-600 mb-2">尚未選擇範本</div>
                 <div className="text-sm text-center max-w-sm leading-relaxed">選擇上方範本後，此處將會顯示建立的問卷並可設定配分比例。</div>
               </div>
            ) : (
               <div className="mt-6 space-y-3">
                 <div className="flex justify-between items-center mb-2 px-2">
                   <span className="text-sm font-bold text-slate-700">問卷列表</span>
                   <span className="text-sm font-bold text-slate-700 mr-[72px]">配分比例 (%)</span>
                 </div>
                 {selectedQuestionnaires.map(q => (
                   <div key={q.name} className="border border-slate-200 rounded-lg p-4 bg-white flex justify-between items-center shadow-sm">
                     <div className="flex items-center flex-1">
                       <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center mr-4 shrink-0">
                         <FileText className="w-4 h-4 text-indigo-600" />
                       </div>
                       <span className="font-bold text-slate-700 text-sm">{q.name}</span>
                     </div>
                     <div className="flex items-center gap-4">
                       <div className="relative">
                         <input 
                           type="number" 
                           min="0"
                           max="100"
                           value={q.weight || ''}
                           onChange={(e) => {
                             const newSelected = selectedQuestionnaires.map(sq => {
                               if (sq.name === q.name) return { ...sq, weight: Number(e.target.value) };
                               return sq;
                             });
                             setSelectedQuestionnaires(newSelected);
                           }}
                           className="w-20 pl-3 pr-6 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-[#0B2544] focus:outline-none text-right font-medium text-slate-700 text-sm appearance-none"
                         />
                         <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">%</span>
                       </div>
                       <button onClick={() => setSelectedQuestionnaires(selectedQuestionnaires.filter(i => i.name !== q.name))} className="text-slate-400 hover:text-slate-600 p-1">
                         <X className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                 ))}
                 
                 <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end pr-[4.5rem]">
                   <div className="flex items-center gap-3">
                     <span className="font-bold text-slate-700 text-sm">總配分比例</span>
                     <span className={`text-lg font-black ${selectedQuestionnaires.reduce((sum, q) => sum + q.weight, 0) === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                       {selectedQuestionnaires.reduce((sum, q) => sum + q.weight, 0)}%
                     </span>
                   </div>
                 </div>
                 {selectedQuestionnaires.reduce((sum, q) => sum + q.weight, 0) !== 100 && (
                   <p className="text-right text-xs text-red-500 font-medium pr-[4.5rem]">
                     請確保總配分比例等於 100%
                   </p>
                 )}
               </div>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center rounded-b-lg">
            <button onClick={() => setStep(1)} className="flex items-center px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors border border-transparent hover:bg-slate-200/50 rounded">
               <ArrowLeft className="w-4 h-4 mr-2" /> 上一步
            </button>
            <button onClick={() => setStep(3)} className="flex items-center px-6 py-2.5 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#0B2544]">
              下一步 <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-2">確認發布</h2>
            <p className="text-sm text-slate-500 mb-8">請確認以下設定內容，確認無誤後即可啟動考核模板。</p>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">考核基本資料</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">考核名稱</div>
                    <div className="text-sm font-medium text-slate-800">2024 年度研發部門績效考核 (複製)</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">適用群組</div>
                    <div className="text-sm font-medium text-slate-800">技術研發部</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">說明</div>
                    <div className="text-sm font-medium text-slate-800">此為從 2024 年度週期複製建立之考核，用於研發部門特定績效追蹤。</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">已選擇的問卷範本與配分</h3>
                {selectedQuestionnaires.length > 0 ? (
                  <div className="space-y-3">
                    {selectedQuestionnaires.map(q => (
                      <div key={q.name} className="flex justify-between items-center text-sm font-medium text-slate-700">
                        <div className="flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0B2544] mr-3"></div>
                          {q.name}
                        </div>
                        <span className="font-bold text-[#0B2544]">{q.weight}%</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-center text-sm font-bold text-slate-800">
                      <span>總計</span>
                      <span className={selectedQuestionnaires.reduce((sum, q) => sum + q.weight, 0) === 100 ? 'text-emerald-600' : 'text-red-500'}>
                        {selectedQuestionnaires.reduce((sum, q) => sum + q.weight, 0)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic">未選擇任何問卷範本</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center rounded-b-lg">
            <button onClick={() => setStep(2)} className="flex items-center px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors border border-transparent hover:bg-slate-200/50 rounded">
               <ArrowLeft className="w-4 h-4 mr-2" /> 上一步
            </button>
            <button onClick={() => navigate('/hr/templates')} className="flex items-center px-6 py-2.5 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#0B2544]">
              <Check className="w-4 h-4 mr-2" /> 確認發布
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
