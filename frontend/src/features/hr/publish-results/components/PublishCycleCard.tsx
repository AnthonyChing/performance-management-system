import React from 'react';
import { Send, CheckCircle, Clock, BarChart2, FileText, Check } from 'lucide-react';
import { PerformanceCycle } from '../types';

interface PublishCycleCardProps {
  cycle: PerformanceCycle;
  completedReviews: number;
  totalEmployees: number;
  gradeDistribution: Record<string, number>;
  onPublish: (id: string) => void;
  isPublishing?: boolean;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'results_published':
      return '已發佈';
    case 'completed':
      return '已完成';
    case 'closed':
      return '已關閉';
    case 'locked':
      return '待發佈';
    case 'in_progress':
      return '進行中';
    case 'not_started':
      return '未開始';
    case 'draft':
      return '草稿';
    default:
      return status;
  }
};

const getGradeLabel = (grade: string) => {
  switch (grade.toLowerCase()) {
    case 'outstanding':
      return '傑出';
    case 'exceeds_expectations':
      return '優秀';
    case 'meets_expectations':
      return '符合';
    case 'needs_improvement':
      return '改善';
    case 'unacceptable':
      return '不合格';
    default:
      return grade;
  }
};

export default function PublishCycleCard({
  cycle,
  completedReviews,
  totalEmployees,
  gradeDistribution,
  onPublish,
  isPublishing = false,
}: PublishCycleCardProps) {
  const isPending = cycle.status !== 'results_published' && cycle.status !== 'completed' && cycle.status !== 'closed';
  const isAllCompleted = totalEmployees > 0 && completedReviews === totalEmployees;
  
  const totalGrades = Object.values(gradeDistribution).reduce((a, b) => a + b, 0);

  const displayDate = cycle.results_published_at
    ? new Date(cycle.results_published_at).toISOString().split('T')[0]
    : '-';

  // Order of rating scales for consistent rendering: highest to lowest
  const orderedGrades = [
    'outstanding',
    'exceeds_expectations',
    'meets_expectations',
    'needs_improvement',
    'unacceptable'
  ];

  return (
    <div className={`bg-white rounded-xl border p-6 shadow-sm flex flex-col justify-between ${isPending ? 'border-amber-200 shadow-md' : 'border-slate-200'}`}>
      <div className="space-y-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isPending ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
              {getStatusLabel(cycle.status)}
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
            <span className="font-mono font-bold text-slate-800">{completedReviews} / {totalEmployees} 人</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${isAllCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} 
              style={{ width: totalEmployees > 0 ? `${(completedReviews / totalEmployees) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-slate-400" /> 等第分佈概覽
          </h4>
          <div className="flex gap-1 h-12 items-end justify-between px-1">
            {orderedGrades.map((grade) => {
              const count = gradeDistribution[grade] || 0;
              const height = totalGrades > 0 ? Math.max((count / totalGrades) * 100, 5) : 5;
              
              // Color helper based on grade severity
              let barColor = 'bg-slate-300';
              if (grade === 'outstanding') barColor = 'bg-emerald-500';
              else if (grade === 'exceeds_expectations') barColor = 'bg-emerald-400';
              else if (grade === 'meets_expectations') barColor = 'bg-indigo-400';
              else if (grade === 'needs_improvement') barColor = 'bg-amber-400';
              else if (grade === 'unacceptable') barColor = 'bg-red-400';

              return (
                <div key={grade} className="flex flex-col items-center flex-1 group">
                  <span className="text-[9px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-150">{count}</span>
                  <div 
                    className={`w-full max-w-[20px] rounded-t-sm transition-all ${barColor}`}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-[10px] font-bold text-slate-600 mt-1 font-sans truncate w-full text-center" title={getGradeLabel(grade)}>
                    {getGradeLabel(grade)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-slate-100">
        {isPending ? (
          <button 
            onClick={() => onPublish(cycle.id)}
            disabled={!isAllCompleted || isPublishing}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors
              ${isAllCompleted && !isPublishing
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            <Send className="w-4 h-4" />
            {isPublishing ? '發佈中...' : isAllCompleted ? '正式發佈考核結果' : '前置未完成不可發布'}
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100">
            <Check className="w-4 h-4" />
            {displayDate} 已發佈
          </div>
        )}
      </div>
    </div>
  );
}
