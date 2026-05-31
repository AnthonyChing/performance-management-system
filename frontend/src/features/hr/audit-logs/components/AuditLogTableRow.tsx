import React from 'react';
import { ShieldAlert, User, FileText, Settings, HelpCircle } from 'lucide-react';

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  createdAt: string;
}

interface AuditLogTableRowProps {
  log: AuditLogItem;
}

export const getLogCategory = (action: string): 'system' | 'evaluation' | 'dispute' | 'template' | 'goal' | 'unknown' => {
  const upper = action.toUpperCase();
  if (upper.includes('APPEAL')) return 'dispute';
  if (upper.includes('GOAL') || upper.includes('KPI')) return 'goal';
  if (upper.includes('TEMPLATE')) return 'template';
  if (upper.includes('CYCLE') || upper.includes('LOGIN') || upper.includes('AUTH')) return 'system';
  if (upper.includes('EVALUATION') || upper.includes('QUESTIONNAIRE')) return 'evaluation';
  return 'system';
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'system': return <Settings className="w-4 h-4 text-slate-500" />;
    case 'evaluation': return <FileText className="w-4 h-4 text-indigo-500" />;
    case 'dispute': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
    case 'template': return <FileText className="w-4 h-4 text-emerald-500" />;
    case 'goal': return <FileText className="w-4 h-4 text-amber-500" />;
    default: return <HelpCircle className="w-4 h-4 text-slate-500" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'system': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'evaluation': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'dispute': return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'template': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'goal': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const formatCategoryLabel = (category: string) => {
  switch (category) {
    case 'system': return '系統發佈';
    case 'evaluation': return '評分考核';
    case 'dispute': return '申覆申訴';
    case 'template': return '考核模板';
    case 'goal': return '目標指標';
    default: return category.toUpperCase();
  }
};

const formatDate = (isoString: string) => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toISOString().replace('T', ' ').substring(0, 19);
  } catch {
    return isoString;
  }
};

export default function AuditLogTableRow({ log }: AuditLogTableRowProps) {
  const category = getLogCategory(log.action);
  const operatorName = log.actorName || '系統/未知操作者';

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
        {formatDate(log.createdAt)}
      </td>
      <td className="px-6 py-4 font-medium text-slate-800">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          {operatorName}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${getTypeColor(category)}`}>
          {getTypeIcon(category)}
          {formatCategoryLabel(category)}
        </span>
      </td>
      <td className="px-6 py-4 font-semibold text-slate-700">
        {log.action}
      </td>
      <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]" title={log.resource}>
        {log.resource}
      </td>
      <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
        {log.ipAddress || '-'}
      </td>
    </tr>
  );
}
