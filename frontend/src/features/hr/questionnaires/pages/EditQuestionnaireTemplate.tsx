import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Info, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import QuestionModal, { QuestionType, QuestionModalSaveData } from '../components/QuestionModal';
import QuestionList from '../components/QuestionList';
import TemplateMetaForm from '../components/TemplateMetaForm';

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

  const handleAddQuestion = async (data: QuestionModalSaveData) => {
    if (!id) return;
    const created = await createAssessmentTemplateQuestion(id, data);
    setQuestions((prev) => [...prev, created]);
    setIsModalOpen(false);
    setEditingQ(null);
  };

  const handleEditQuestion = async (data: QuestionModalSaveData) => {
    if (!id || !editingQ) return;
    const updated = await updateAssessmentTemplateQuestion(id, editingQ.id, data);
    setQuestions((prev) => prev.map((q) => (q.id === editingQ.id ? updated : q)));
    setIsModalOpen(false);
    setEditingQ(null);
  };

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

      <TemplateMetaForm
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        jobCategory={jobCategory}
        setJobCategory={setJobCategory}
        onSaveMeta={handleSaveMeta}
        saving={saving}
      />

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
          <QuestionList
            questions={questions}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onEdit={(q) => { setEditingQ(q as TemplateQuestion); setIsModalOpen(true); }}
            onDelete={(q) => void handleDeleteQuestion(q)}
          />
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
