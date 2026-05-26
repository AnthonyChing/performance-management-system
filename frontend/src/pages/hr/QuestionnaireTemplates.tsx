import React from 'react';
import { LayoutGrid, HelpCircle, History } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuestionnaireTemplates() {
  const templates = [
    {
      id: 1,
      title: '2024 年度員工滿意度調查',
      category: '核心文化',
      questionCount: 15,
      lastUpdated: '2023-12-15'
    },
    {
      id: 2,
      title: '管理層領導力 360 度回饋',
      category: '管理層領導力',
      questionCount: 24,
      lastUpdated: '2024-01-10'
    },
    {
      id: 3,
      title: '新進員工試用期回饋',
      category: '團隊協作',
      questionCount: 10,
      lastUpdated: '2024-05-20'
    },
    {
      id: 4,
      title: 'Q3 季度開發技能評估表',
      category: '專業技能',
      questionCount: 32,
      lastUpdated: '2024-06-01'
    }
  ];

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">問卷模板列表</h1>
          <p className="text-sm text-slate-500 mt-1">管理與建立組織內部的績效評估及回饋問卷模板。</p>
        </div>
        <Link to="/hr/questionnaires/new" className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#0B2544]">
          <span className="font-bold text-lg mr-2 leading-none">+</span>
          新增問卷模板
        </Link>
      </div>

      <div className="space-y-4">
        {templates.map(template => (
          <div key={template.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center">
             <div className="mb-4 md:mb-0">
               <div className="flex items-center gap-3 mb-2">
                 <h3 className="text-lg font-bold text-slate-800">{template.title}</h3>
               </div>
               <div className="flex flex-wrap items-center text-sm text-slate-500 gap-6">
                 <div className="flex items-center">
                    <HelpCircle className="w-4 h-4 mr-1.5 text-slate-400" />
                    {template.questionCount} 個問題
                 </div>
                 <div className="flex items-center">
                    <History className="w-4 h-4 mr-1.5 text-slate-400" />
                    最後更新 : {template.lastUpdated}
                 </div>
               </div>
             </div>
             
             <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
                <Link to={`/hr/questionnaires/${template.id}`} className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
                   查看詳情
                </Link>
             </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between items-center text-sm text-slate-500">
        <div>
           顯示 1 至 4，共 12 個模板
        </div>
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
