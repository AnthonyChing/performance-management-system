import React from 'react';

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-slate-100 text-slate-600' },
  published: { label: '已發布', className: 'bg-green-100 text-green-700' },
};

interface TemplateStatusBadgeProps {
  status: string;
  className?: string;
}

export default function TemplateStatusBadge({ status, className = '' }: TemplateStatusBadgeProps) {
  const statusInfo = STATUS_LABEL[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusInfo.className} ${className}`}>
      {statusInfo.label}
    </span>
  );
}
