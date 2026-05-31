import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GripVertical, Edit2, Trash2, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import {
  getAssessmentTemplate,
  listAssessmentTemplateQuestions,
  deleteAssessmentTemplateQuestion,
  reorderAssessmentTemplateQuestions,
  ApiRequestError,
} from '../api';
import type { AssessmentTemplate, TemplateQuestion } from '../types';

const QUESTION_TYPE_LABEL: Record<string, string> = {
  rating: 'Rating Scale (評分級距)',
  text: 'Text (簡答題)',
  boolean: 'Multiple Choice (單選題)',
};

export default function ViewQuestionnaireTemplate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [questions, setQuestions] = useState<TemplateQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const dragIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([getAssessmentTemplate(id), listAssessmentTemplateQuestions(id)])
      .then(([tmpl, qRes]) => {
        if (!mounted) return;
        setTemplate(tmpl);
        // Cast to full TemplateQuestion - list endpoint returns subset but same shape
        setQuestions(qRes.data as unknown as TemplateQuestion[]);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e instanceof ApiRequestError ? e.message : '無法載入模板資料');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [id]);

  const handleDeleteQuestion = async (questionId: string) => {
    if (!id || !window.confirm('確定要刪除此問題？')) return;
    setActionError(null);
    try {
      await deleteAssessmentTemplateQuestion(id, questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : '刪除問題失敗');
    }
  };

  // Drag-to-reorder
  const handleDragStart = (idx: number) => { dragIndexRef.current = idx; };
  const handleDrop = async (dropIdx: number) => {
    const dragIdx = dragIndexRef.current;
    if (dragIdx === null || dragIdx === dropIdx || !id) return;
    const reordered = [...questions];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setQuestions(reordered);
    dragIndexRef.current = null;
    try {
      await reorderAssessmentTemplateQuestions(id, reordered.map((q) => q.id));
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : '重新排序失敗');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />載入中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-8 text-sm text-red-700 justify-center">
        <AlertCircle className="w-5 h-5 shrink-0" />{error}
      </div>
    );
  }

  if (!template) return null;

  const statusLabel = template.status === 'published' ? '已發布' : '草稿';
  const statusClass = template.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600';

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/hr/questionnaires')}
            className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-2 gap-1"
          >
            <ArrowLeft className="w-4 h-4" />返回列表
          </button>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{template.name}</h1>
          {template.description && (
            <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">{template.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusClass}`}>{statusLabel}</span>
            {template.job_category && (
              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                職類：{template.job_category}
              </span>
            )}
          </div>
        </div>
        <Link
          to={`/hr/questionnaires/${id}/edit`}
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Edit2 className="w-4 h-4 mr-2" />編輯
        </Link>
      </div>

      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />{actionError}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        {questions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">此模板尚無問題。</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
                className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-grab active:cursor-grabbing"
              >
                <button className="mt-1 text-slate-400 hover:text-slate-600">
                  <GripVertical className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-800 mb-2">{q.question_text}</h3>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2 text-xs font-bold">題目類型</span>
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 text-xs font-medium">
                        {QUESTION_TYPE_LABEL[q.question_type] ?? q.question_type}
                      </span>
                    </div>
                    {q.rating_scale_max != null && (
                      <div className="flex items-center">
                        <span className="text-slate-500 mr-2 text-xs font-bold">評分範圍</span>
                        <span className="text-slate-700 text-xs font-bold">1 – {q.rating_scale_max}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2 text-xs font-bold">是否為必填</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${q.is_required ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                        {q.is_required ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  title="刪除問題"
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mt-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-slate-600">
            共計 <span className="font-bold text-slate-800">{questions.length}</span> 個問題
          </div>
        </div>
      </div>
    </div>
  );
}
