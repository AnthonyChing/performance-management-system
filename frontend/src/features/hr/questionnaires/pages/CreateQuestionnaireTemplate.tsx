import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Info, Loader2, AlertCircle } from 'lucide-react';
import {
  createAssessmentTemplate,
  createAssessmentTemplateQuestion,
  ApiRequestError,
} from '../api';
import QuestionModal, { QuestionType, QuestionModalSaveData } from '../components/QuestionModal';
import QuestionList from '../components/QuestionList';
import TemplateMetaForm from '../components/TemplateMetaForm';

interface QuestionDraft {
  localId: number;
  backendId?: string;
  question_text: string;
  question_type: QuestionType;
  rating_scale_max: number;
  is_required: boolean;
}

export default function CreateQuestionnaireTemplate() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [jobCategory, setJobCategory] = useState('');

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<QuestionDraft | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dragIndexRef = useRef<number | null>(null);

  const handleAddQuestion = (q: QuestionModalSaveData) => {
    setQuestions((prev) => [...prev, { ...q, rating_scale_max: q.rating_scale_max ?? 5, localId: Date.now() }]);
    setIsModalOpen(false);
    setEditingQ(null);
  };

  const handleEditQuestion = (q: QuestionModalSaveData) => {
    setQuestions((prev) =>
      prev.map((item) => (item.localId === editingQ!.localId ? { ...item, ...q, rating_scale_max: q.rating_scale_max ?? 5 } : item)),
    );
    setIsModalOpen(false);
    setEditingQ(null);
  };

  const handleDeleteQuestion = (q: any) => {
    setQuestions((prev) => prev.filter((item) => item.localId !== q.localId));
  };

  const handleDragStart = (idx: number) => { dragIndexRef.current = idx; };
  const handleDrop = (dropIdx: number) => {
    const dragIdx = dragIndexRef.current;
    if (dragIdx === null || dragIdx === dropIdx) return;
    const reordered = [...questions];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setQuestions(reordered);
    dragIndexRef.current = null;
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('請輸入問卷名稱'); return; }
    setSaving(true);
    setError(null);
    try {
      const tmpl = await createAssessmentTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        job_category: jobCategory.trim() || undefined,
      });

      // Add questions sequentially to preserve order
      for (const q of questions) {
        await createAssessmentTemplateQuestion(tmpl.id, {
          question_text: q.question_text,
          question_type: q.question_type,
          rating_scale_max: q.question_type === 'rating' ? q.rating_scale_max : undefined,
          is_required: q.is_required,
        });
      }

      navigate('/hr/questionnaires');
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : '儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">新增問卷</h1>
          <p className="text-sm text-slate-500 mt-1">建立全新的考核問卷模板。</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <TemplateMetaForm
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        jobCategory={jobCategory}
        setJobCategory={setJobCategory}
      />

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
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Info className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm">目前尚無題目，請點擊右上方「新增問題」開始建立問卷內容。</p>
          </div>
        ) : (
          <QuestionList
            questions={questions}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onEdit={(q) => { setEditingQ(q as QuestionDraft); setIsModalOpen(true); }}
            onDelete={(q) => handleDeleteQuestion(q as QuestionDraft)}
          />
        )}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="text-sm font-medium text-slate-600">
            共計 <span className="font-bold text-slate-800">{questions.length}</span> 個問題
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 flex items-center gap-2 py-2 bg-[#0B2544] text-white rounded font-bold text-sm hover:bg-[#13335A] transition-colors shadow-sm disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            儲存問卷
          </button>
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
