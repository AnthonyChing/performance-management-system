import React from 'react';
import { ArrowLeft, Edit, Info, Users, ClipboardList, PenTool, TrendingUp, Compass } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export default function ReviewTemplateDetail() {
  const { id } = useParams();

  // Mock data based on ID could go here. For now, static content.

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center gap-4">
           <h1 className="text-2xl font-bold text-slate-800 tracking-tight">2023年度績效考核範本</h1>
           <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 tracking-wide uppercase">
             ACTIVE
           </span>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <Link to="/hr/templates" className="flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded font-medium text-sm hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Link>
          <button className="flex items-center px-4 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#0B2544]">
            <Edit className="w-4 h-4 mr-2" />
            編輯模板
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 基本資訊 */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Info className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800">基本資訊</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="md:col-span-3">
                  <div className="text-sm font-semibold text-slate-500 mb-1">模板說明</div>
                  <p className="text-slate-700 leading-relaxed text-sm">
                    用於公司全體員工 2023 年度之績效評估，包含核心勝任力與業務目標達成度之綜合考核。
                  </p>
               </div>
               <div>
                  <div className="text-sm font-semibold text-slate-500 mb-1">最後更新日期</div>
                  <div className="text-slate-700 text-sm font-medium">2023-11-15</div>
               </div>
            </div>
          </div>
        </div>

        {/* 員工群組 */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800">員工群組</h2>
          </div>
          <div className="p-6">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
               <div className="bg-indigo-50 px-6 py-4 border-r border-slate-200 flex flex-col justify-center items-center shrink-0 w-40">
                  <Users className="w-6 h-6 text-indigo-600 mb-2" />
                  <div className="text-xs text-indigo-600/80 mb-0.5">目標對象</div>
                  <div className="font-bold text-indigo-900 text-sm">全體員工</div>
               </div>
               <div className="p-6 flex items-center text-sm text-slate-700">
                  此模板適用於所有部門的正式職員。
               </div>
            </div>
          </div>
        </div>

        {/* 選用問卷 */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800">選用問卷</h2>
          </div>
          <div className="p-6 space-y-3">
             <div className="flex justify-between items-center p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-white">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                     <PenTool className="w-4 h-4 text-slate-600" />
                   </div>
                   <span className="font-bold text-slate-800 text-sm">核心勝任力評估</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-500">配分比例</span>
                  <span className="font-bold text-[#0B2544]">40%</span>
                </div>
             </div>

             <div className="flex justify-between items-center p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-white">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                     <TrendingUp className="w-4 h-4 text-slate-600" />
                   </div>
                   <span className="font-bold text-slate-800 text-sm">業務目標達成狀況</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-500">配分比例</span>
                  <span className="font-bold text-[#0B2544]">50%</span>
                </div>
             </div>

             <div className="flex justify-between items-center p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-white">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                     <Compass className="w-4 h-4 text-slate-600" />
                   </div>
                   <span className="font-bold text-slate-800 text-sm">個人發展計劃</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-500">配分比例</span>
                  <span className="font-bold text-[#0B2544]">10%</span>
                </div>
             </div>
             <div className="flex justify-end p-4 border-t border-slate-100 mt-2">
                 <div className="flex items-center gap-3">
                     <span className="text-sm text-slate-600 font-bold">總計</span>
                     <span className="text-lg font-black text-emerald-600">100%</span>
                 </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
