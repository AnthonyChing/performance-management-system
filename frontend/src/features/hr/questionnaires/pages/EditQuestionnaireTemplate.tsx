import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, GripVertical, Edit2, Trash2, X, Info, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getAssessmentTemplate,
  updateAssessmentTemplate,
  listAssessmentTemplateQuestions,
  createAssessmentTemplateQuestion,
  updateAssessmentTemplateQuestion,
  deleteAssessmentTemplateQuestion,
  reorderAssessmentTemplateQuestions,
  publishAssessmentTemplate,
  ApiRequestError,
} from '../api';
import type { AssessmentTemplate, TemplateQuestion } from '../types';

type QuestionType = 'rating' | 'text' | 'boolean';

const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'rating', label: 'Rating Scale (評分級距)' },
  { value: 'text', label: 'Text (簡答題)' },
  { value: 'boolean', label: 'Multiple Choice (單選題)' },
];

function QuestionModal({
  initial,
  onSave,
  onClose,
}: {
  initial: TemplateQuestion | null;
  onSave: (data: {
    question_text: string;
    question_type: QuestionType;
    rating_scale_max?: number;
    is_required: boolean;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial?.question_text ?? '');
  const [type, setType] = useState<QuestionType>((initial?.question_type as QuestionType) ?? 'rating');
  const [scale, setScale] = useState(initial?.rating_scale_max ?? 5);
  const [required, setRequired] = useState(initial?.is_required ?? true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    if (!text.trim()) { setErr('請輸入問題題目'); return; }
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        question_text: text.trim(),
        question_type: type,
        rating_scale_max: type === 'rating' ? scale : undefined,
        is_required: required,
      });
    } catch (e) {
      setErr(e instanceof ApiRequestError ? e.message : '儲存失敗');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{initial ? '編輯問卷問題' : '建立問卷問題'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {err && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{err}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">問題題目 (QUESTION TITLE)</label>
            <textarea
              rows={4}
              className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm resize-none"
              placeholder="請輸入績效考核問題描述..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">問題類型 (QUESTION TYPE)</label>
              <select
                className="w-full border border-slate-300 rounded-md py-2.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm appearance-none"
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {type === 'rating' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">評分最高分 (MAX SCALE)</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">是否為必填 (IS MANDATORY)</label>
            <div className="flex items-center gap-4">
              <select
                className="w-48 border border-slate-300 rounded-md py-2.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm appearance-none"
                value={required ? 'yes' : 'no'}
                onChange={(e) => setRequired(e.target.value === 'yes')}
              >
                <option value="yes">Yes (是)</option>
                <option value="no">No (否)</option>
              </select>
              <div className="flex items-center text-sm text-slate-500">
                <Info className="w-4 h-4 mr-1.5" />
                此設定會影響問卷的驗證規則
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !text.trim()}
            className="px-5 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? '確定儲存' : '確定新增問題'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditQuestionnaireTemplate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [jobCategory, setJobCategory] = useState('');

  const [questions, setQuestions] = useState<TemplateQuestion[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<TemplateQuestion | null>(null);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const dragIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoadingInit(true);
    setInitError(null);

    Promise.all([getAssessmentTemplate(id), listAssessmentTemplateQuestions(id)])
      .then(([tmpl, qRes]) => {
        if (!mounted) return;
        setTemplate(tmpl);
        setName(tmpl.name);
        setDescription(tmpl.description ?? '');
        setJobCategory(tmpl.job_category ?? '');
        setQuestions(qRes.data as unknown as TemplateQuestion[]);
      })
      .catch((e) => {
        if (mounted) setInitError(e instanceof ApiRequestError ? e.message : '無法載入模板資料');
      })
      .finally(() => { if (mounted) setLoadingInit(false); });

    return () => { mounted = false; };
  }, [id]);

  const handleSaveMeta = async () => {
    if (!id || !name.trim()) { setActionError('請輸入問卷名稱'); return; }
    setSaving(true);
    setActionError(null);
    setSuccessMsg(null);
    try {
      const updated = await updateAssessmentTemplate(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        job_category: jobCategory.trim() || undefined,
      });
      setTemplate(updated);
      setSuccessMsg('問卷基本資料已更新');
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : '更新失敗');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    if (!window.confirm('發布後問卷將進入已發布狀態，確定繼續？')) return;
    setPublishing(true);
    setActionError(null);
    setSuccessMsg(null);
    try {
      await publishAssessmentTemplate(id);
      setSuccessMsg('問卷已發布！');
      navigate('/hr/questionnaires');
    } catch (e) {
      setActionError(e instanceof ApiRequestError ? e.message : '發布失敗');
    } finally {
      setPublishing(false);
    }
  };

  const handleAddQuestion = async (data: Parameters<React.ComponentProps<typeof QuestionModal>['onSave']>[0]) => {
    if (!id) return;
    const created = await createAssessmentTemplateQuestion(id, data);
    setQuestions((prev) => [...prev, created]);
    setIsModalOpen(false);
    setEditingQ(null);
  };

  const handleEditQuestion = async (data: Parameters<React.ComponentProps<typeof QuestionModal>['onSave']>[0]) => {
    if (!id || !editingQ) return;
    const updated = await updateAssessmentTemplateQuestion(id, editingQ.id, data);
    setQuestions((prev) => prev.map((q) => (q.id === editingQ.id ? updated : q)));
    setIsModalOpen(false);
    setEditingQ(null);
  };

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

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />載入中...
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-8 text-sm text-red-700 justify-center">
        <AlertCircle className="w-5 h-5 shrink-0" />{initError}
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            編輯問卷：{template?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">修改問卷模板的基本資料與題目列表。</p>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />{actionError}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}
        </div>
      )}

      {/* Meta section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">
              問卷名稱 (QUESTIONNAIRE NAME) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">問卷說明 (DESCRIPTION)</label>
            <textarea
              rows={3}
              className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide">職類 (JOB CATEGORY)</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#0B2544] focus:border-transparent text-sm"
              value={jobCategory}
              onChange={(e) => setJobCategory(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveMeta}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-slate-700 text-white rounded font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              儲存基本資料
            </button>
          </div>
        </div>
      </div>

      {/* Questions section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">問卷題目</h2>
        <button
          onClick={() => { setEditingQ(null); setIsModalOpen(true); }}
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />新增問題
        </button>
      </div>

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
                        {TYPE_OPTIONS.find((o) => o.value === q.question_type)?.label ?? q.question_type}
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
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => { setEditingQ(q); setIsModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-slate-600">
            共計 <span className="font-bold text-slate-800">{questions.length}</span> 個問題
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePublish}
              disabled={publishing || template?.status === 'published'}
              className="flex items-center gap-2 px-5 py-2 bg-[#0B2544] text-white rounded font-medium text-sm hover:bg-[#13335A] transition-colors shadow-sm disabled:opacity-50"
            >
              {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
              {template?.status === 'published' ? '已發布' : '發布更新'}
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <QuestionModal
          initial={editingQ}
          onSave={editingQ ? handleEditQuestion : handleAddQuestion}
          onClose={() => { setIsModalOpen(false); setEditingQ(null); }}
        />
      )}
    </div>
  );
}
