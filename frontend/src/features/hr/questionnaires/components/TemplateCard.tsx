import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, History, Copy, Trash2 } from 'lucide-react';
import type { AssessmentTemplateListItem } from '../types';
import TemplateStatusBadge from './TemplateStatusBadge';

interface TemplateCardProps {
  template: AssessmentTemplateListItem;
  onDuplicate: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export default function TemplateCard({ template, onDuplicate, onDelete }: TemplateCardProps) {
  return (
    <div
      className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center"
    >
      <div className="mb-4 md:mb-0">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-bold text-slate-800">{template.name}</h3>
          <TemplateStatusBadge status={template.status} />
        </div>
        <div className="flex flex-wrap items-center text-sm text-slate-500 gap-6">
          {template.job_category && (
            <div className="flex items-center">
              <History className="w-4 h-4 mr-1.5 text-slate-400" />
              職類：{template.job_category}
            </div>
          )}
          <div className="flex items-center">
            <HelpCircle className="w-4 h-4 mr-1.5 text-slate-400" />
            {template.is_active ? '啟用中' : '已停用'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
        <Link
          to={`/hr/questionnaires/${template.id}`}
          className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-center rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
        >
          查看詳情
        </Link>
        <button
          onClick={() => void onDuplicate(template.id)}
          title="複製"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => void onDelete(template.id)}
          title="刪除"
          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
