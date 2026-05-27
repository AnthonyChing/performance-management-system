import React from 'react';
import { FileText, TrendingUp, ShieldCheck, UserCog } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HR_REVIEW_TEMPLATES } from '../api';

export default function ReviewTemplates() {

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">考核模板列表</h1>
          <p className="text-sm text-slate-500 mt-1">管理與編輯組織內部的績效考核、季度目標及反饋範本。</p>
        </div>
        <Link to="/hr/templates/new" className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#0B2544]">
          <span className="font-bold text-lg mr-2 leading-none">+</span>
          新增模板
        </Link>
      </div>

      <div className="space-y-4">
        {HR_REVIEW_TEMPLATES.map(template => (
          <div key={template.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center">
             <div className="flex items-start gap-4 mb-4 md:mb-0">
               <div className={`w-12 h-12 rounded-lg ${template.iconBg} flex items-center justify-center shrink-0`}>
                 <template.icon className={`w-6 h-6 ${template.iconColor}`} />
               </div>
               <div>
                 <div className="flex items-center gap-3 mb-1">
                   <h3 className="text-lg font-bold text-slate-800">{template.title}</h3>
                 </div>
                 <div className="flex items-center text-sm text-slate-500 gap-4">
                   <div className="flex items-center">
                      <span className="mr-1">適用對象:</span> {template.target}
                   </div>
                   <div className="flex items-center">
                      <span className="mr-1">考核週期:</span> {template.cycle}
                   </div>
                   <div className="flex items-center">
                      <span className="mr-1">最後更新:</span> {template.lastUpdated}
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="flex items-center gap-2">
                <Link to={`/hr/templates/${template.id}`} className="px-4 py-2 text-sm font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
                   查看詳情
                </Link>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
