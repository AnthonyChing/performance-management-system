import React, { useState } from 'react';
import { Send, CheckCircle, Clock, BarChart2, AlertCircle, FileText, Check } from 'lucide-react';
import { HR_REVIEW_CYCLES_MOCK } from '../api';

interface ReviewCycle {
  id: string;
  name: string;
  status: string;
  totalEmployees: number;
  completedReviews: number;
  publishDate: string;
  gradeDistribution: Record<string, number>;
}

export default function PublishResults() {
  const [cycles, setCycles] = useState(HR_REVIEW_CYCLES_MOCK);

  const handlePublish = (id: string) => {
    if (confirm('確定要發佈此考核結果嗎？發佈後各同仁將會收到成績通知，且不可再撤回或修改評核內容！')) {
      setCycles(prev => prev.map(c => 
        c.id === id 
          ? { ...c, status: '已發佈', publishDate: new Date().toISOString().split('T')[0] } 
          : c
      ));
      alert('績效考核結果已成功發佈！同仁將收到信件通知。');
    }
  };

  return (
    <div className="w-full space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">發佈考核結果</h1>
          <p className="text-slate-500 text-sm mt-1">檢視各考核週期整體驗收情況，並將最終考評結果公告發送給全體同仁與主管。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex items-start gap-4 col-span-full">
          <AlertCircle className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-indigo-900">發佈聲明與注意事項</h3>
            <p className="text-sm text-indigo-700 leading-relaxed">
              僅有在所有單位、所有成員皆完成「直屬主管評分」與「雙方績效面談」後，方可解鎖發佈功能。
              一旦發布，考評記錄將永久封存至歷史紀錄中供員工本人查詢，不可逆轉。
            </p>
          </div>
        </div>

        {cycles.map(cycle => {
          const isPending = cycle.status === '待發佈';
          const isAllCompleted = cycle.totalEmployees === cycle.completedReviews;
          const totalGrades = Object.values(cycle.gradeDistribution).reduce((a: any, b: any) => (a as number) + (b as number), 0);

          return (
            <div key={cycle.id} className={`bg-white rounded-xl border p-6 shadow-sm flex flex-col justify-between ${isPending ? 'border-amber-200 shadow-md' : 'border-slate-200'}`}>
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {isPending ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {cycle.status}
                    </span>
                    <h2 className="text-lg font-bold text-slate-800 leading-tight pr-4">{cycle.name}</h2>
                  </div>
                  <div className="p-2 border border-slate-100 bg-slate-50 rounded-lg shrink-0">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">考核進度狀況</span>
                    <span className="font-mono font-bold text-slate-800">{cycle.completedReviews} / {cycle.totalEmployees} 人</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${isAllCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                      style={{ width: `${(cycle.completedReviews / cycle.totalEmployees) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-slate-400" /> 等第分佈概覽
                  </h4>
                  <div className="flex gap-1 h-12 items-end justify-between px-1">
                    {Object.entries(cycle.gradeDistribution).map(([grade, count]) => {
                      const numericCount = count as number;
                      const numericTotal = totalGrades as number;
                      const height = Math.max((numericCount / numericTotal) * 100, 5);
                      return (
                        <div key={grade} className="flex flex-col items-center flex-1 group">
                          <span className="text-[9px] text-slate-400 font-mono opacity-0 group-hover:opacity-100">{count}</span>
                          <div 
                            className={`w-full max-w-[20px] rounded-t-sm transition-all ${grade.startsWith('A') ? 'bg-emerald-400' : grade.startsWith('B') ? 'bg-indigo-400' : 'bg-amber-400'}`}
                            style={{ height: `${height}px` }}
                          />
                          <span className="text-[10px] font-bold text-slate-600 mt-1 font-mono">{grade}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                {isPending ? (
                  <button 
                    onClick={() => handlePublish(cycle.id)}
                    disabled={!isAllCompleted}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors
                      ${isAllCompleted 
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <Send className="w-4 h-4" />
                    {isAllCompleted ? '正式發佈考核結果' : '前置未完成不可發布'}
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100">
                    <Check className="w-4 h-4" />
                    {cycle.publishDate} 已發佈
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
