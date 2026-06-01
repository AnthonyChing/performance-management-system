import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, Edit2 } from 'lucide-react';
import {
  getAssessmentTemplate,
  listAssessmentTemplateQuestions,
  deleteAssessmentTemplateQuestion,
  reorderAssessmentTemplateQuestions,
  publishAssessmentTemplate,
  ApiRequestError,
} from '../api';
import type { AssessmentTemplate, TemplateQuestion } from '../types';
import TemplateStatusBadge from '../components/TemplateStatusBadge';
import QuestionList from '../components/QuestionList';

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

  const handleDeleteQuestion = async (q: any) => {
    const questionId = q.id;
    if (!id || !window.confirm('確定要刪除此問題？')) return;
    setActionError(null);
    try {
      await deleteAssessmentTemplateQuestion(id, questionId);
      setQuestions((prev) => prev.filter((item) => item.id !== questionId));
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : '刪除問題失敗');
    }
  };

  const handlePublish = async () => {
    if (!id || !window.confirm('確定要發佈此問卷模板？發佈後將無法修改問題與結構。')) return;
    setActionError(null);
    try {
      const res = await publishAssessmentTemplate(id);
      setTemplate((prev) => prev ? { ...prev, status: res.status } : null);
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : '發佈失敗，請稍後再試');
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
            <TemplateStatusBadge status={template.status} />
            {template.job_category && (
              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                職類：{template.job_category}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
          {template.status === 'draft' && (
            <button
              onClick={handlePublish}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-emerald-600 border border-transparent text-white rounded font-medium text-sm hover:bg-emerald-700 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              發佈問卷
            </button>
          )}
          {template.status === 'draft' && (
            <Link
              to={`/hr/questionnaires/${id}/edit`}
              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Edit2 className="w-4 h-4 mr-2" />編輯
            </Link>
          )}
        </div>
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
          <QuestionList
            questions={questions}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDelete={handleDeleteQuestion}
          />
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
