import { AlertCircle } from 'lucide-react';
import type { Appeal } from '../types';

interface DisputeDetailInfoProps {
  appeal: Appeal;
}

export default function DisputeDetailInfo({ appeal }: DisputeDetailInfoProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
        <AlertCircle className="w-4 h-4 text-indigo-500" />
        申覆詳情
      </h3>

      <div>
        <h4 className="text-[10px] font-bold text-slate-500 mb-2 font-mono uppercase tracking-wider">
          員工陳述理由
        </h4>
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-xs tracking-wide leading-relaxed text-slate-600 shadow-inner min-h-[120px] max-h-[240px] overflow-y-auto whitespace-pre-wrap">
          {appeal.reason}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">指派類型</p>
          <p className="text-sm font-bold text-slate-700">{appeal.assigned_to_type}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">回覆數</p>
          <p className="text-sm font-bold text-slate-700">{appeal.responses?.length ?? 0} 則</p>
        </div>
      </div>
    </div>
  );
}
