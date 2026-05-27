import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { StatusType, Goal } from '../../../shared/types';
import { COMMON_MOCK_GOALS } from '../../../shared/api/mockData';

const StatusBadge = ({ status }: { status: StatusType }) => {
  const styles = {
    '進行中': 'bg-green-100 text-green-700',
    '待審核': 'bg-yellow-100 text-yellow-700',
    '草稿': 'bg-slate-100 text-slate-600',
    '已完成': 'bg-indigo-100 text-indigo-700',
    '待處理': 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-3 ${styles[status]}`}>
      {status}
    </span>
  );
};

export default function PeriodHistoryGoals() {
  const { periodId } = useParams();

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">歷史目標 <span className="font-normal text-slate-600 text-lg">（所屬考核週期：2025年度考核）</span></h1>
          <div className="text-sm text-slate-500 mt-1 flex px-1 breadcrumbs">
             主控台 <ChevronRight className="w-3 h-3 mx-1 mt-1" /> <Link to="/goals/history" className="hover:text-slate-800">歷史目標頁面</Link>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {COMMON_MOCK_GOALS.map((goal) => (
           <div key={goal.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex items-center justify-between hover:border-slate-300 transition-colors">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3 className="text-base font-bold text-slate-800">{goal.title}</h3>
                <StatusBadge status={goal.status} />
              </div>
              <p className="text-xs text-slate-500 mt-2">截止日期：{goal.dueDate}</p>
            </div>
            
            <div className="flex-1 px-8">
               <div className="flex justify-between text-xs font-medium text-slate-600 mb-2">
                  <span>當前進度</span>
                  <span className="font-bold text-slate-800">{goal.progress}%</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${goal.progress}%` }}></div>
               </div>
            </div>

            <div className="w-32 flex justify-end">
                  <Link to={`/goals/history/${periodId}/${goal.id}`} className="flex items-center px-4 py-2 border border-slate-300 rounded font-medium text-slate-700 bg-white hover:bg-slate-50 text-sm group transition-colors">
                     查看詳情
                     <ChevronRight className="w-4 h-4 ml-2 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
