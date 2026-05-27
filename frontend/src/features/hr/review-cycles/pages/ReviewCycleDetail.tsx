import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Clock, Users, FileText, CheckCircle2 } from 'lucide-react';
import { HR_REVIEW_CYCLE_DETAIL_MOCK } from '../api';

export default function ReviewCycleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data based on id
  const cycle = {
    id,
    ...HR_REVIEW_CYCLE_DETAIL_MOCK
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/hr/cycles')} className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{cycle.name}</h1>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
              {cycle.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">考核週期詳細資訊與設定</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
           <h2 className="text-lg font-bold text-slate-800">週期設定</h2>
           <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded font-medium text-sm hover:bg-slate-50 transition-colors">
              編輯設定
           </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">週期類型</div>
              <div className="text-sm font-medium text-slate-800 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-slate-400" />
                {cycle.type}
              </div>
            </div>
            
            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Review Period Range</div>
              <div className="text-sm font-medium text-slate-800 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                {cycle.periodRange}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Manager Evaluation Period</div>
              <div className="text-sm font-medium text-slate-800 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                {cycle.managerEvalPeriod}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">績效異議時段</div>
              <div className="text-sm font-medium text-slate-800 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                {cycle.objectionPeriod}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Results Announcement Date</div>
              <div className="text-sm font-medium text-slate-800 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                {cycle.announcementDate}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
