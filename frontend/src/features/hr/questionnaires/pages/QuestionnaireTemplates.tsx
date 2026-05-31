import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, BookOpen } from 'lucide-react';
import {
  listAssessmentTemplates,
  deleteAssessmentTemplate,
  duplicateAssessmentTemplate,
  ApiRequestError,
} from '../api';
import type { AssessmentTemplateListItem } from '../types';
import TemplateCard from '../components/TemplateCard';

export default function QuestionnaireTemplates() {
  const [templates, setTemplates] = useState<AssessmentTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadTemplates = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAssessmentTemplates({ page: p });
      setTemplates(res.data);
      setTotalPages(res.meta.total_pages);
      setTotalCount(res.meta.total_count);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : '無法載入問卷模板列表');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates(page);
  }, [loadTemplates, page]);

  const handleDuplicate = async (id: string) => {
    setActionError(null);
    try {
      await duplicateAssessmentTemplate(id);
      void loadTemplates(page);
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : '複製失敗，請稍後再試');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除此問卷模板？此操作無法復原。')) return;
    setActionError(null);
    try {
      await deleteAssessmentTemplate(id);
      void loadTemplates(page);
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : '刪除失敗，請稍後再試');
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">問卷模板列表</h1>
          <p className="text-sm text-slate-500 mt-1">管理與建立組織內部的績效評估及回饋問卷模板。</p>
        </div>
        <Link
          to="/hr/questionnaires/new"
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#0B2544]"
        >
          <span className="font-bold text-lg mr-2 leading-none">+</span>
          新增問卷模板
        </Link>
      </div>

      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          載入中...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-8 text-sm text-red-700 justify-center">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <BookOpen className="w-10 h-10" />
          <p className="text-sm">尚無問卷模板，請點擊「新增問卷模板」開始建立。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="mt-8 flex justify-between items-center text-sm text-slate-500">
          <div>共 {totalCount} 個模板</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded font-medium ${
                  p === page
                    ? 'bg-[#0B2544] text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-40"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
