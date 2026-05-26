import React from 'react';
import { Calendar, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReviewCycles() {
  const cycles = [
    {
      id: 1,
      title: '2024 年度績效考核',
      status: '進行中',
      type: '年度考核',
      duration: '執行期間: 2024.01.01 - 2024.12.31',
      statusColor: 'bg-emerald-100 text-emerald-700',
      action1: '查看詳情',
    },
    {
      id: 2,
      title: '2023 第四季度考核',
      status: '已結束',
      type: '季度考核',
      duration: '執行期間: 2023.10.01 - 2023.12.31',
      statusColor: 'bg-slate-100 text-slate-700',
      action1: '查看詳情',
    },
    {
      id: 3,
      title: '2024 研發部專案考核',
      status: '草稿',
      type: '專案考核',
      duration: '預計期間: 2024.06.01 - 2024.06.30',
      statusColor: 'bg-indigo-100 text-indigo-700',
      action1: '查看詳情',
    },
    {
      id: 4,
      title: '2024 新進員工試用期考核',
      status: '即將開始',
      type: '試用期考核',
      duration: '執行期間: 2024.03.15 - 2024.04.15',
      statusColor: 'bg-orange-100 text-orange-700',
      action1: '查看詳情',
    }
  ];

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">考核週期列表</h1>
          <p className="text-sm text-slate-500 mt-1">管理與追蹤所有組織內的績效考核流程</p>
        </div>
        <Link 
          to="/hr/cycles/new"
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#0B2544]"
        >
          <span className="font-bold text-lg mr-2 leading-none">+</span>
          新增考核週期
        </Link>
      </div>

      <div className="space-y-4">
        {cycles.map(cycle => (
          <div key={cycle.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center">
             <div className="mb-4 md:mb-0">
               <div className="flex items-center gap-3 mb-2">
                 <h3 className="text-lg font-bold text-slate-800">{cycle.title}</h3>
                 <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cycle.statusColor}`}>
                   {cycle.status}
                 </span>
               </div>
               <div className="flex items-center text-sm text-slate-500 gap-6">
                 <div className="flex items-center">
                    <Settings className="w-4 h-4 mr-1.5 text-slate-400" />
                    {cycle.type}
                 </div>
                 <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                    {cycle.duration}
                 </div>
               </div>
             </div>
             
             <div className="flex items-center gap-2">
                <Link to={`/hr/cycles/${cycle.id}`} className="px-4 py-2 text-sm font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
                   {cycle.action1}
                </Link>
             </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-2">
           <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:bg-slate-50">&lt;</button>
           <button className="w-8 h-8 flex items-center justify-center rounded bg-[#0B2544] text-white font-medium">1</button>
           <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">2</button>
           <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">3</button>
           <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:bg-slate-50">&gt;</button>
        </div>
      </div>
    </div>
  );
}
